/**
 * Multi-tenant request routing middleware for Estades Delta.
 *
 * Volto SSR receives requests for any hostname routed to it by Traefik. This
 * middleware inspects the incoming Host (or X-Forwarded-Host) header and
 * rewrites the URL so the same Plone tree backs three families of audience:
 *
 *   1. Marketplace aggregator at `estadesdelta.{cat,local}` and `www.*`  → `/`
 *   2. Per-property microsite at a custom domain (resolved dynamically from
 *      Plone, or from VOLTO_TENANT_MAP fallback) → `/properties/<slug>`
 *   3. Per-property microsite at a subdomain like `<slug>.estadesdelta.local`
 *      → `/properties/<slug>` (auto-derived from the first label)
 *
 * --- Option B (dynamic resolver, default) ---
 *
 * On Volto SSR startup, the middleware kicks off a background task that fetches
 *   GET <PLONE_API>/++api++/@search?portal_type=Property
 *       &metadata_fields=custom_domain&metadata_fields=short_name
 * and builds the host→path map dynamically. The result is cached in memory and
 * refreshed every TENANT_REFRESH_MS (default 10 min). New properties created in
 * Plone become routable within one refresh cycle without restarting Volto.
 *
 * The static VOLTO_TENANT_MAP env var still works as a fallback:
 *   - used immediately on the first request, before the first fetch has
 *     completed (cold-start guard);
 *   - used to override / supplement the dynamic map for hotfix paths that
 *     don't follow the canonical /properties/<slug> shape (e.g. legacy
 *     content under /ca/Josep-test/...).
 *
 * Merge rule: dynamicMap entries WIN over staticMap entries for the same host.
 *
 * --- Path conventions ---
 *
 * Values returned by the dynamic resolver always have the canonical shape
 * `/properties/<short_name>` (no language prefix — Volto's multilingual router
 * prepends /<defaultLanguage>/ automatically). The static map may include the
 * language prefix as an Option-A hotfix for legacy content paths.
 *
 * Fallback for unknown hosts: render the marketplace.
 */
import type { Request, Response, NextFunction } from 'express';

export interface TenantMap {
  [hostname: string]: string;
}

interface PloneSearchBrain {
  '@id': string;
  custom_domain?: string;
  short_name?: string;
  id?: string;
}

interface PloneSearchResponse {
  items_total: number;
  items: PloneSearchBrain[];
}

const MARKETPLACE_HOSTS = new Set<string>([
  'estadesdelta.cat',
  'www.estadesdelta.cat',
  'estadesdelta.local',
  'www.estadesdelta.local',
]);

const MICROSITE_PARENT_SUFFIXES = ['.estadesdelta.cat', '.estadesdelta.local'];

const DEFAULT_REFRESH_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_FETCH_TIMEOUT_MS = 5_000;

function parseTenantMap(raw: string | undefined): TenantMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as TenantMap;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(
      '[tenantRouting] VOLTO_TENANT_MAP is not valid JSON; ignoring.',
      e,
    );
  }
  return {};
}

function extractHostname(req: Request): string {
  const forwarded = req.headers['x-forwarded-host'];
  const raw =
    (typeof forwarded === 'string'
      ? forwarded
      : Array.isArray(forwarded)
        ? forwarded[0]
        : null) ||
    req.headers.host ||
    '';
  // Strip optional :port suffix.
  return String(raw).split(':')[0].toLowerCase();
}

function resolveTenantPath(
  hostname: string,
  dynamicMap: TenantMap,
  staticMap: TenantMap,
): string | null {
  if (MARKETPLACE_HOSTS.has(hostname)) return null;
  // Dynamic wins; static is the fallback (and Option-A hotfix carrier).
  if (dynamicMap[hostname]) return dynamicMap[hostname];
  if (staticMap[hostname]) return staticMap[hostname];
  for (const suffix of MICROSITE_PARENT_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      const slug = hostname.slice(0, -suffix.length);
      if (slug && slug !== 'www') return `/properties/${slug}`;
    }
  }
  return null;
}

/**
 * Build host→path map from a Plone @search response.
 * Brains with no `custom_domain` are skipped (they're only reachable via
 * subdomain wildcard, which the suffix rule handles).
 */
export function buildMapFromBrains(brains: PloneSearchBrain[]): TenantMap {
  const map: TenantMap = {};
  for (const b of brains) {
    const host = (b.custom_domain ?? '').trim().toLowerCase();
    const slug = (b.short_name ?? b.id ?? '').trim();
    if (!host || !slug) continue;
    map[host] = `/properties/${slug}`;
  }
  return map;
}

interface FetchOptions {
  apiUrl: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Fetch the dynamic tenant map from Plone. Returns an empty map on any error
 * (caller decides whether to keep the previous cached map or use static-only).
 */
export async function fetchDynamicTenantMap(
  opts: FetchOptions,
): Promise<TenantMap> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeout = opts.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const url =
    `${opts.apiUrl.replace(/\/$/, '')}/++api++/@search` +
    `?portal_type=Property&b_size=500` +
    `&metadata_fields=custom_domain&metadata_fields=short_name`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetchImpl(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(
        `[tenantRouting] Plone @search returned ${res.status}; keeping previous map.`,
      );
      return {};
    }
    const body = (await res.json()) as PloneSearchResponse;
    return buildMapFromBrains(body.items ?? []);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      '[tenantRouting] Failed to fetch dynamic tenant map:',
      (err as Error).message,
    );
    return {};
  } finally {
    clearTimeout(timer);
  }
}

export interface TenantRoutingOptions {
  /** Static fallback map (used before the first dynamic fetch resolves). */
  staticTenantMap?: string;
  /** Plone backend base URL (no trailing slash). */
  apiUrl?: string;
  /** Refresh interval in milliseconds; 0 disables dynamic resolution. */
  refreshMs?: number;
  /** Fetch timeout in milliseconds. */
  timeoutMs?: number;
  /** Injected fetch (for tests). */
  fetchImpl?: typeof fetch;
}

/**
 * Express middleware factory. Schedules a background refresh of the dynamic
 * map and returns a synchronous handler that does the URL rewrite.
 *
 * The handler itself never awaits — it reads from the in-memory cache. The
 * first request that arrives before the first fetch finishes will fall back
 * to the static map / subdomain rule, which is acceptable: in dev the static
 * map covers known hosts, and in prod the first refresh runs within ms of
 * server boot.
 */
export function tenantRoutingMiddleware(options: TenantRoutingOptions = {}) {
  const staticMap = parseTenantMap(
    options.staticTenantMap ?? process.env.VOLTO_TENANT_MAP,
  );
  const apiUrl =
    options.apiUrl ??
    process.env.RAZZLE_INTERNAL_API_PATH ??
    process.env.RAZZLE_API_PATH ??
    '';
  const refreshMs = options.refreshMs ?? DEFAULT_REFRESH_MS;

  let dynamicMap: TenantMap = {};

  if (apiUrl && refreshMs > 0) {
    const refresh = async () => {
      const next = await fetchDynamicTenantMap({
        apiUrl,
        timeoutMs: options.timeoutMs,
        fetchImpl: options.fetchImpl,
      });
      // Only replace if non-empty; on empty (error) keep the previous map.
      if (Object.keys(next).length > 0) {
        dynamicMap = next;
        // eslint-disable-next-line no-console
        console.log(
          `[tenantRouting] Dynamic map refreshed: ${Object.keys(dynamicMap).length} hosts.`,
        );
      }
    };
    // Kick off immediately; do NOT await — the middleware factory must remain
    // synchronous so Volto's express setup is not blocked at boot.
    refresh();
    // Refresh forever. unref() so the timer never holds Node alive on its own.
    const interval = setInterval(refresh, refreshMs);
    if (typeof interval.unref === 'function') interval.unref();
  }

  return function tenantRouting(
    req: Request,
    _res: Response,
    next: NextFunction,
  ) {
    const hostname = extractHostname(req);
    const tenantPath = resolveTenantPath(hostname, dynamicMap, staticMap);

    // Annotate the request so views downstream can read the resolved tenant.
    (req as Request & { __tenantHost?: string }).__tenantHost = hostname;

    if (tenantPath && (req.url === '/' || req.url === '')) {
      // Rewrite only the root request; deep links keep their own paths.
      req.url = tenantPath;
    }

    next();
  };
}

export default tenantRoutingMiddleware;
