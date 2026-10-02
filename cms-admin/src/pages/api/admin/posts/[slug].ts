import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../lib/session';
import { deletePost, getPostPair, updatePost, validatePostInput, type PostInput } from '../../../../lib/posts';
import { cacheInvalidateAll } from '../../../../lib/cache';
import { GitHubApiError } from '../../../../lib/github';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  if (!requireAuth(request)) return unauthorized();
  const slug = params.slug!;
  try {
    const post = await getPostPair(slug);
    if (!post) return json({ error: 'Not found' }, 404);
    return json(post, 200);
  } catch (err) {
    return githubError(err);
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  if (!requireAuth(request)) return unauthorized();
  const slug = params.slug!;

  let input: Partial<PostInput>;
  try {
    input = await request.json();
  } catch {
    return json({ error: 'Invalid payload' }, 400);
  }
  input.slug = slug; // slug comes from the URL, body can't change it (use delete+create to rename)

  const validationError = validatePostInput(input);
  if (validationError) return json({ error: validationError }, 400);

  try {
    await updatePost(slug, input as PostInput);
    cacheInvalidateAll();
    return json({ ok: true }, 200);
  } catch (err) {
    return githubError(err);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  if (!requireAuth(request)) return unauthorized();
  const slug = params.slug!;
  try {
    await deletePost(slug);
    cacheInvalidateAll();
    return json({ ok: true }, 200);
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
