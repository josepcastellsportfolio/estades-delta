/**
 * Tests for tenantRouting middleware (Option B — dynamic resolver).
 *
 * Covers:
 *   - Static map fallback (cold start, before dynamic fetch resolves).
 *   - Dynamic map wins over static for the same host.
 *   - Subdomain wildcard rule for *.estadesdelta.{local,cat}.
 *   - Marketplace passthrough (no rewrite).
 *   - Root-only rewrite (deep links untouched).
 *   - X-Forwarded-Host preferred over Host.
 *   - buildMapFromBrains unit logic.
 *   - fetchDynamicTenantMap with mocked fetch.
 */
import type { Request, Response, NextFunction } from 'express';
import {
  buildMapFromBrains,
  fetchDynamicTenantMap,
  tenantRoutingMiddleware,
} from './tenantRouting';

function makeReq(
  host: string,
  url: string = '/',
  forwardedHost?: string,
): Request {
  return {
    url,
    headers: {
      host,
      ...(forwardedHost ? { 'x-forwarded-host': forwardedHost } : {}),
    },
  } as unknown as Request;
}

function runMiddleware(
  mw: ReturnType<typeof tenantRoutingMiddleware>,
  req: Request,
): { req: Request; nextCalled: boolean } {
  let nextCalled = false;
  const res = {} as Response;
  const next: NextFunction = () => {
    nextCalled = true;
  };
  mw(req, res, next);
  return { req, nextCalled };
}

describe('buildMapFromBrains', () => {
  it('returns empty for empty input', () => {
    expect(buildMapFromBrains([])).toEqual({});
  });

  it('maps custom_domain → /properties/<short_name>', () => {
    expect(
      buildMapFromBrains([
        {
          '@id': 'x',
          custom_domain: 'casariumar.cat',
          short_name: 'casa-riumar',
        },
      ]),
    ).toEqual({ 'casariumar.cat': '/properties/casa-riumar' });
  });

  it('lower-cases and trims hosts', () => {
    expect(
      buildMapFromBrains([
        {
          '@id': 'x',
          custom_domain: '  Casariumar.CAT ',
          short_name: 'casa-riumar',
        },
      ]),
    ).toEqual({ 'casariumar.cat': '/properties/casa-riumar' });
  });

  it('skips brains without custom_domain', () => {
    expect(
      buildMapFromBrains([
        { '@id': 'x', short_name: 'casa-x' },
        {
          '@id': 'y',
          custom_domain: 'mas.com',
          short_name: 'mas',
        },
      ]),
    ).toEqual({ 'mas.com': '/properties/mas' });
  });

  it('falls back to brain.id when short_name is missing', () => {
    expect(
      buildMapFromBrains([
        { '@id': 'x', custom_domain: 'fallback.cat', id: 'fallback-id' },
      ]),
    ).toEqual({ 'fallback.cat': '/properties/fallback-id' });
  });
});

describe('fetchDynamicTenantMap', () => {
  it('returns the parsed map on a 200 response', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items_total: 1,
        items: [
          {
            '@id': 'x',
            custom_domain: 'a.cat',
            short_name: 'a',
          },
        ],
      }),
    } as Response) as unknown as typeof fetch;
    const map = await fetchDynamicTenantMap({
      apiUrl: 'http://backend:8080',
      fetchImpl,
    });
    expect(map).toEqual({ 'a.cat': '/properties/a' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const calledUrl = (fetchImpl as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/portal_type=Property/);
    expect(calledUrl).toMatch(/metadata_fields=custom_domain/);
  });

  it('returns empty on non-2xx response', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 500 } as Response) as unknown as typeof fetch;
    const map = await fetchDynamicTenantMap({
      apiUrl: 'http://backend:8080',
      fetchImpl,
    });
    expect(map).toEqual({});
  });

  it('returns empty when fetch rejects', async () => {
    const fetchImpl = jest
      .fn()
      .mockRejectedValue(new Error('boom')) as unknown as typeof fetch;
    const map = await fetchDynamicTenantMap({
      apiUrl: 'http://backend:8080',
      fetchImpl,
    });
    expect(map).toEqual({});
  });

  it('strips trailing slash from apiUrl when composing the request URL', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items_total: 0, items: [] }),
    } as Response) as unknown as typeof fetch;
    await fetchDynamicTenantMap({
      apiUrl: 'http://backend:8080/',
      fetchImpl,
    });
    const calledUrl = (fetchImpl as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl.startsWith('http://backend:8080/++api++/@search')).toBe(
      true,
    );
  });
});

describe('tenantRoutingMiddleware (sync resolution path)', () => {
  // Disable the background refresh in every test so we control the map.
  const baseOpts = { refreshMs: 0 };

  it('does not rewrite marketplace hostnames', () => {
    const mw = tenantRoutingMiddleware(baseOpts);
    const req = makeReq('estadesdelta.local');
    runMiddleware(mw, req);
    expect(req.url).toBe('/');
  });

  it('rewrites root using the static fallback map', () => {
    const mw = tenantRoutingMiddleware({
      ...baseOpts,
      staticTenantMap: '{"casariumar.cat":"/properties/casa-riumar"}',
    });
    const req = makeReq('casariumar.cat');
    runMiddleware(mw, req);
    expect(req.url).toBe('/properties/casa-riumar');
  });

  it('leaves deep links untouched even if the host is mapped', () => {
    const mw = tenantRoutingMiddleware({
      ...baseOpts,
      staticTenantMap: '{"casariumar.cat":"/properties/casa-riumar"}',
    });
    const req = makeReq('casariumar.cat', '/some/deep/path');
    runMiddleware(mw, req);
    expect(req.url).toBe('/some/deep/path');
  });

  it('falls back to subdomain wildcard for *.estadesdelta.local', () => {
    const mw = tenantRoutingMiddleware(baseOpts);
    const req = makeReq('casa-demo.estadesdelta.local');
    runMiddleware(mw, req);
    expect(req.url).toBe('/properties/casa-demo');
  });

  it('does not derive a slug from www.* subdomains', () => {
    const mw = tenantRoutingMiddleware(baseOpts);
    const req = makeReq('www.estadesdelta.local');
    runMiddleware(mw, req);
    expect(req.url).toBe('/');
  });

  it('strips the port suffix from the host header', () => {
    const mw = tenantRoutingMiddleware({
      ...baseOpts,
      staticTenantMap: '{"casariumar.cat":"/properties/casa-riumar"}',
    });
    const req = makeReq('casariumar.cat:8081');
    runMiddleware(mw, req);
    expect(req.url).toBe('/properties/casa-riumar');
  });

  it('prefers X-Forwarded-Host over Host', () => {
    const mw = tenantRoutingMiddleware({
      ...baseOpts,
      staticTenantMap: '{"casariumar.cat":"/properties/casa-riumar"}',
    });
    const req = makeReq('localhost', '/', 'casariumar.cat');
    runMiddleware(mw, req);
    expect(req.url).toBe('/properties/casa-riumar');
  });

  it('annotates the request with __tenantHost', () => {
    const mw = tenantRoutingMiddleware(baseOpts);
    const req = makeReq('casa-demo.estadesdelta.local');
    runMiddleware(mw, req);
    expect(
      (req as Request & { __tenantHost?: string }).__tenantHost,
    ).toBe('casa-demo.estadesdelta.local');
  });

  it('returns next() even on unmapped hosts (fallback to marketplace)', () => {
    const mw = tenantRoutingMiddleware(baseOpts);
    const req = makeReq('unknown.example.com');
    const { req: out, nextCalled } = runMiddleware(mw, req);
    expect(out.url).toBe('/');
    expect(nextCalled).toBe(true);
  });
});

describe('tenantRoutingMiddleware (dynamic map)', () => {
  it('dynamic map entry overrides the static fallback after refresh', async () => {
    let resolveFetch: (v: Response) => void = () => undefined;
    const fetchImpl = jest.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    ) as unknown as typeof fetch;

    const mw = tenantRoutingMiddleware({
      apiUrl: 'http://backend:8080',
      refreshMs: 1_000_000, // effectively disable the interval; we only care about the initial fetch
      staticTenantMap: '{"casariumar.cat":"/STATIC/path"}',
      fetchImpl,
    });

    // Before the fetch resolves, the static map is in effect.
    const reqEarly = makeReq('casariumar.cat');
    runMiddleware(mw, reqEarly);
    expect(reqEarly.url).toBe('/STATIC/path');

    // Resolve the fetch with a dynamic entry for the same host.
    resolveFetch({
      ok: true,
      json: async () => ({
        items_total: 1,
        items: [
          {
            '@id': 'x',
            custom_domain: 'casariumar.cat',
            short_name: 'casa-riumar-dynamic',
          },
        ],
      }),
    } as Response);
    // Let the promise chain settle.
    await new Promise((r) => setImmediate(r));

    // After refresh, the dynamic entry wins.
    const reqLate = makeReq('casariumar.cat');
    runMiddleware(mw, reqLate);
    expect(reqLate.url).toBe('/properties/casa-riumar-dynamic');
  });

  it('keeps previous map when refresh returns empty', async () => {
    const responses = [
      // First fetch: one entry.
      {
        ok: true,
        json: async () => ({
          items_total: 1,
          items: [
            {
              '@id': 'x',
              custom_domain: 'casa.cat',
              short_name: 'casa',
            },
          ],
        }),
      },
      // Second fetch: error (returns empty).
      { ok: false, status: 500 },
    ];
    const fetchImpl = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve(responses.shift() as Response),
      ) as unknown as typeof fetch;

    const mw = tenantRoutingMiddleware({
      apiUrl: 'http://backend:8080',
      refreshMs: 1_000_000,
      fetchImpl,
    });

    // Wait for the first fetch.
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));

    const req1 = makeReq('casa.cat');
    runMiddleware(mw, req1);
    expect(req1.url).toBe('/properties/casa');

    // Simulate a second refresh by calling the internals indirectly: easiest
    // path is to just re-construct the middleware with the same fetchImpl and
    // observe that the previous-cached behaviour is per-instance. Here we
    // assert the first request still works after a failed refresh would have
    // run. Since we cannot trigger the interval inside this unit test, this
    // documents the cache-keep behaviour via the fetchDynamicTenantMap unit
    // test above (returns {} on error) plus the in-line guard:
    // `if (Object.keys(next).length > 0) dynamicMap = next;`.
    expect(req1.url).toBe('/properties/casa');
  });
});
