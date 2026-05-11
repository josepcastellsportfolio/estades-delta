/**
 * Multi-tenant request routing middleware for Estades Delta.
 *
 * Volto SSR receives requests for any hostname routed to it by Traefik. This
 * middleware inspects the incoming Host (or X-Forwarded-Host) header and
 * rewrites the URL so the same Plone tree backs three families of audience:
 *
 *   1. Marketplace aggregator at `estadesdelta.{cat,local}` and `www.*`  → `/`
 *   2. Per-property microsite at a custom domain listed in VOLTO_TENANT_MAP
 *      → `/properties/<slug>` (mapped explicitly per host)
 *   3. Per-property microsite at a subdomain like `<slug>.estadesdelta.local`
 *      → `/properties/<slug>` (auto-derived from the first label)
 *
 * VOLTO_TENANT_MAP is a JSON env var:
 *   { "casariumar.cat": "/properties/casa-riumar" }
 *
 * Fallback for unknown hosts: render the marketplace.
 */
import type { Request, Response, NextFunction } from 'express';

interface TenantMap {
  [hostname: string]: string;
}

const MARKETPLACE_HOSTS = new Set<string>([
  'estadesdelta.cat',
  'www.estadesdelta.cat',
  'estadesdelta.local',
  'www.estadesdelta.local',
]);

const MICROSITE_PARENT_SUFFIXES = ['.estadesdelta.cat', '.estadesdelta.local'];

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
  tenantMap: TenantMap,
): string | null {
  if (MARKETPLACE_HOSTS.has(hostname)) return null;
  if (tenantMap[hostname]) return tenantMap[hostname];
  for (const suffix of MICROSITE_PARENT_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      const slug = hostname.slice(0, -suffix.length);
      if (slug && slug !== 'www') return `/properties/${slug}`;
    }
  }
  return null;
}

export function tenantRoutingMiddleware(rawTenantMap?: string) {
  const tenantMap = parseTenantMap(
    rawTenantMap ?? process.env.VOLTO_TENANT_MAP,
  );

  return function tenantRouting(
    req: Request,
    _res: Response,
    next: NextFunction,
  ) {
    const hostname = extractHostname(req);
    const tenantPath = resolveTenantPath(hostname, tenantMap);

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
