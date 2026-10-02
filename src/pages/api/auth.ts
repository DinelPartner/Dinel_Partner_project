import type { APIRoute } from 'astro';

export const prerender = false;

// Step 1 of the Decap/Sveltia CMS "github" backend OAuth flow:
// the CMS admin UI opens this route in a popup, we redirect the browser
// straight to GitHub's own OAuth authorize screen.
export const GET: APIRoute = async ({ url }) => {
  const clientId = import.meta.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return new Response('Missing GITHUB_OAUTH_CLIENT_ID env var', { status: 500 });
  }

  const redirectUri = `${url.origin}/api/callback`;
  const state = crypto.randomUUID();

  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', 'repo,user');
  authorizeUrl.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl.toString(),
      'Set-Cookie': `oauth_state=${state}; Path=/; HttpOnly; Max-Age=600; SameSite=Lax`,
    },
  });
};
