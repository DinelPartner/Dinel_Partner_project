import type { APIRoute } from 'astro';
import { getPostPair } from '../../../lib/posts';
import { cacheGet, cacheSet } from '../../../lib/cache';
import { corsHeaders } from '../../../lib/cors';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const cors = corsHeaders(request);
  const slug = params.slug;
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  try {
    const cacheKey = `public:post:${slug}`;
    let post = cacheGet<Awaited<ReturnType<typeof getPostPair>>>(cacheKey);
    if (post === undefined) {
      post = await getPostPair(slug);
      cacheSet(cacheKey, post);
    }

    // Drafts are never exposed on the public API, 404 exactly like "not found".
    if (!post || post.published !== true) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    return new Response(JSON.stringify(post), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        ...cors,
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to load post' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }
};

export const OPTIONS: APIRoute = async ({ request }) => {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
};
