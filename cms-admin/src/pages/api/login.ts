import type { APIRoute } from 'astro';
import { constantTimeStringEqual, createSessionCookieValue, sessionCookieHeader } from '../../lib/session';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid payload' }, 400);
  }

  const expected = import.meta.env.ADMIN_PASSWORD;
  if (!expected) {
    return json({ error: 'Server misconfigured (ADMIN_PASSWORD not set)' }, 500);
  }

  const provided = String(body.password || '');
  // Constant-time comparison so response timing can't be used to guess the
  // password character-by-character.
  if (!provided || !constantTimeStringEqual(provided, expected)) {
    return json({ error: 'Incorrect password' }, 401);
  }

  const cookieValue = createSessionCookieValue();
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': sessionCookieHeader(cookieValue),
    },
  });
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
