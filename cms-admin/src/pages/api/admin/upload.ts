import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/session';
import { putFile, GitHubApiError } from '../../../lib/github';
import { IMAGES_DIR, SLUG_RE } from '../../../lib/posts';

export const prerender = false;

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

/** Keep only safe filename characters; strip any path separators / traversal attempts. */
function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() || 'upload';
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/^\.+/, ''); // no leading dots (hidden files / ".." fragments)
  return cleaned || 'upload';
}

export const POST: APIRoute = async ({ request }) => {
  if (!requireAuth(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let body: { slug?: string; filename?: string; dataBase64?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid payload' }, 400);
  }

  const slug = String(body.slug || '');
  if (!SLUG_RE.test(slug)) {
    return json({ error: 'Invalid or missing slug' }, 400);
  }

  const rawFilename = String(body.filename || '');
  const safeName = sanitizeFilename(rawFilename);
  const ext = safeName.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXT.has(ext)) {
    return json({ error: 'Only .jpg, .jpeg, .png and .webp images are allowed' }, 400);
  }

  const dataBase64 = body.dataBase64 || '';
  // Strip a data: URL prefix if the client sent one (data:image/png;base64,....).
  const base64 = dataBase64.includes(',') ? dataBase64.slice(dataBase64.indexOf(',') + 1) : dataBase64;
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    return json({ error: 'Invalid image data' }, 400);
  }
  if (buffer.length === 0) {
    return json({ error: 'Empty file' }, 400);
  }
  if (buffer.length > MAX_BYTES) {
    return json({ error: `Image too large (max ${MAX_BYTES / (1024 * 1024)}MB)` }, 400);
  }

  // Build the path from already-sanitized, independently-validated
  // components only — never concatenate raw user input directly, to
  // prevent path traversal into the rest of the repo.
  const uniqueName = `${Date.now()}-${safeName}`;
  const path = `${IMAGES_DIR}/${slug}/${uniqueName}`;

  try {
    await putFile(path, buffer, `CMS: upload image for "${slug}"`);
    return json({ ok: true, path: `/${path}` }, 201);
  } catch (err) {
    if (err instanceof GitHubApiError) {
      const status = err.code === 'rate_limited' ? 429 : err.code === 'unauthorized' ? 502 : err.status;
      return json({ error: err.message }, status);
    }
    return json({ error: 'Upload failed' }, 500);
  }
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
