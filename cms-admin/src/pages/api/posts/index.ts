import type { APIRoute } from 'astro';
import { listPublishedPostsLean } from '../../../lib/posts';
import { cacheGet, cacheSet } from '../../../lib/cache';
import { corsHeaders } from '../../../lib/cors';
import { GitHubApiError } from '../../../lib/github';

export const prerender = false;

const CACHE_KEY = 'public:posts:list';

export const GET: APIRoute = async ({ request }) => {
  const cors = corsHeaders(request);
  try {
    let list = cacheGet<unknown>(CACHE_KEY);
    if (!list) {
      list = await listPublishedPostsLean();
      cacheSet(CACHE_KEY, list);
    }
    return new Response(JSON.stringify(list), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        ...cors,
      },
    });
  } catch (err) {
    const status = err instanceof GitHubApiError ? err.status : 500;
    return new Response(JSON.stringify({ error: 'Failed to load posts' }), {
      status: status >= 400 && status < 600 ? 502 : 500,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }
};

export const OPTIONS: APIRoute = async ({ request }) => {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
};
