import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../lib/session';
import { createPost, listAllPosts, validatePostInput, type PostInput } from '../../../../lib/posts';
import { cacheInvalidateAll } from '../../../../lib/cache';
import { GitHubApiError } from '../../../../lib/github';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!requireAuth(request)) return unauthorized();
  try {
    const posts = await listAllPosts();
    return json(posts, 200);
  } catch (err) {
    return githubError(err);
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!requireAuth(request)) return unauthorized();

  let input: Partial<PostInput>;
  try {
    input = await request.json();
  } catch {
    return json({ error: 'Invalid payload' }, 400);
  }

  const validationError = validatePostInput(input);
  if (validationError) return json({ error: validationError }, 400);

  try {
    await createPost(input as PostInput);
    cacheInvalidateAll();
    return json({ ok: true, slug: input.slug }, 201);
  } catch (err) {
    return githubError(err);
  }
};

function unauthorized() {
  return json({ error: 'Unauthorized' }, 401);
}

function githubError(err: unknown) {
  if (err instanceof GitHubApiError) {
    const status = err.code === 'conflict' ? 409 : err.code === 'rate_limited' ? 429 : err.code === 'unauthorized' ? 502 : err.status;
    return json({ error: err.message, code: err.code }, status);
  }
  const message = err instanceof Error ? err.message : 'Unknown error';
  return json({ error: message }, 400);
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
