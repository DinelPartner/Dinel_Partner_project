/**
 * CORS for the two PUBLIC read endpoints only (/api/posts, /api/posts/[slug]).
 * Deliberately NOT a wildcard: the client asked that only the production
 * one.com domain(s) can call these from a browser. Both the apex and the
 * www subdomain are allowed explicitly (one of them is what the site
 * actually resolves to; allowing both avoids a footgun if that ever
 * changes), configurable via ALLOWED_ORIGIN for staging/testing.
 */

const DEFAULT_ALLOWED = ['https://www.dinelpartner.se', 'https://dinelpartner.se'];

function allowedOrigins(): string[] {
  const extra = import.meta.env.ALLOWED_ORIGIN;
  return extra ? [...DEFAULT_ALLOWED, extra] : DEFAULT_ALLOWED;
}

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowed = allowedOrigins();
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    Vary: 'Origin',
  };
}
