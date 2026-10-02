import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Stateless session cookie, signed with HMAC-SHA256.
 *
 * Why not PHP-style sessions: the old panel used $_SESSION, which relies on a
 * persistent PHP process writing session files to local disk between
 * requests. A Vercel serverless function has no such persistent process or
 * local disk shared across invocations — every request can hit a cold,
 * freshly-spun-up instance. The standard, architecturally-correct substitute
 * for "the server remembers who's logged in" in a stateless serverless
 * environment is a signed cookie: the server never stores session state at
 * all, it just verifies (via HMAC) that a cookie it previously handed out
 * hasn't been tampered with and hasn't expired. This is not a downgrade from
 * PHP sessions, it is the standard pattern for serverless auth.
 *
 * Cookie value format: `${expiresAtMs}.${hmacHex}`
 * HMAC is computed over the string `${expiresAtMs}` using SESSION_SECRET.
 */

const COOKIE_NAME = 'cms_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function secret(): string {
  const s = import.meta.env.SESSION_SECRET;
  if (!s) throw new Error('Missing SESSION_SECRET environment variable');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

export function createSessionCookieValue(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = String(expiresAt);
  const mac = sign(payload);
  return `${payload}.${mac}`;
}

export function verifySessionCookieValue(value: string | undefined | null): boolean {
  if (!value) return false;
  const dot = value.indexOf('.');
  if (dot === -1) return false;
  const payload = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  const expected = sign(payload);

  const macBuf = Buffer.from(mac, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (macBuf.length !== expectedBuf.length) return false;
  if (!timingSafeEqual(macBuf, expectedBuf)) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt)) return false;
  return Date.now() < expiresAt;
}

export function constantTimeStringEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    // Still do a comparison of equal-length buffers to avoid a short-circuit
    // timing signal on length, even though length itself leaks a little.
    timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export { COOKIE_NAME };

/** Reads and verifies the session cookie from an incoming Request. */
export function requireAuth(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${COOKIE_NAME}=`));
  if (!match) return false;
  const value = decodeURIComponent(match.slice(COOKIE_NAME.length + 1));
  return verifySessionCookieValue(value);
}

export function sessionCookieHeader(value: string): string {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
