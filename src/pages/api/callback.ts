import type { APIRoute } from 'astro';

export const prerender = false;

// Step 2 of the Decap/Sveltia CMS "github" backend OAuth flow:
// GitHub redirects back here with a `code`. We exchange it server-side
// (this is the step that needs the client secret and therefore can't run
// in the browser), then hand the token to the CMS popup via postMessage,
// following the exact message shape Decap/Sveltia's CMS JS listens for.
export const GET: APIRoute = async ({ url }) => {
  const clientId = import.meta.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_OAUTH_CLIENT_SECRET;
  const code = url.searchParams.get('code');

  if (!clientId || !clientSecret) {
    return htmlResponse(renderScript('error', 'Missing GitHub OAuth server configuration'));
  }
  if (!code) {
    return htmlResponse(renderScript('error', 'Missing OAuth code'));
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
      return htmlResponse(renderScript('error', tokenData.error_description || 'OAuth token exchange failed'));
    }

    return htmlResponse(renderScript('success', JSON.stringify({ token: tokenData.access_token, provider: 'github' })));
  } catch (err) {
    return htmlResponse(renderScript('error', 'OAuth token exchange failed'));
  }
};

function renderScript(status: 'success' | 'error', content: string) {
  // Matches the "authorizing:github" postMessage handshake that
  // Decap CMS / Sveltia CMS's github backend expects from the popup.
  return `
    <!doctype html>
    <html>
      <body>
        <script>
          (function() {
            function receiveMessage(message) {
              window.opener.postMessage(
                'authorization:github:${status}:${content.replace(/'/g, "\\'")}',
                message.origin
              );
              window.removeEventListener('message', receiveMessage, false);
            }
            window.addEventListener('message', receiveMessage, false);
            window.opener.postMessage('authorizing:github', '*');
          })();
        </script>
      </body>
    </html>
  `;
}

function htmlResponse(body: string) {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
