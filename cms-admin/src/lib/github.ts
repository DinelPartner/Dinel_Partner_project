/**
 * Thin, server-side-only wrapper around the GitHub Contents API using plain
 * fetch() (no Octokit — this is the only GitHub call surface the whole app
 * needs, so a dependency wasn't worth it). NEVER import this from a .tsx/.jsx
 * component that could ship to the browser — it reads GITHUB_TOKEN directly.
 *
 * Repo layout this operates on (content lives at the REPO ROOT, not inside
 * cms-admin/ or src/ — see repo README):
 *   content/blog/<slug>.sv.md
 *   content/blog/<slug>.en.md
 *   content/blog/images/<slug>/<filename>
 */

const API_BASE = 'https://api.github.com';

export class GitHubApiError extends Error {
  status: number;
  code: 'not_found' | 'conflict' | 'rate_limited' | 'unauthorized' | 'unknown';

  constructor(message: string, status: number, code: GitHubApiError['code']) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.code = code;
  }
}

function env() {
  const token = import.meta.env.GITHUB_TOKEN;
  const owner = import.meta.env.GITHUB_OWNER;
  const repo = import.meta.env.GITHUB_REPO;
  const branch = import.meta.env.GITHUB_BRANCH || 'main';
  if (!token || !owner || !repo) {
    throw new GitHubApiError(
      'Missing GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO environment variables',
      500,
      'unknown',
    );
  }
  return { token, owner, repo, branch };
}

function headers(token: string, extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  };
}

async function handleErrors(res: Response, context: string): Promise<never> {
  if (res.status === 401 || res.status === 403) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    if (res.status === 403 && remaining === '0') {
      const reset = res.headers.get('x-ratelimit-reset');
      throw new GitHubApiError(
        `GitHub API rate limit exceeded (resets at ${reset ? new Date(Number(reset) * 1000).toISOString() : 'unknown'}) while ${context}`,
        429,
        'rate_limited',
      );
    }
    throw new GitHubApiError(`GitHub token missing/invalid or lacks permission while ${context}`, 401, 'unauthorized');
  }
  if (res.status === 404) {
    throw new GitHubApiError(`Not found on GitHub while ${context}`, 404, 'not_found');
  }
  if (res.status === 409 || res.status === 422) {
    throw new GitHubApiError(`SHA conflict (file changed since last read) while ${context}`, 409, 'conflict');
  }
  let body = '';
  try {
    body = await res.text();
  } catch {
    /* ignore */
  }
  throw new GitHubApiError(`GitHub API error ${res.status} while ${context}: ${body}`, res.status, 'unknown');
}

export interface GitHubFile {
  path: string;
  sha: string;
  content: string; // decoded UTF-8 text
}

/** Raw fetch of a single content entry. Returns null on 404. Shared by getFile() and getFileRaw(). */
async function getFileRawEntry(path: string): Promise<{ sha: string; base64: string } | null> {
  const { token, owner, repo, branch } = env();
  const res = await fetch(
    `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponentPath(path)}?ref=${encodeURIComponent(branch)}`,
    { headers: headers(token) },
  );
  if (res.status === 404) return null;
  if (!res.ok) await handleErrors(res, `reading ${path}`);
  const data = (await res.json()) as { sha: string; content: string };
  return { sha: data.sha, base64: data.content };
}

/** GET /repos/{owner}/{repo}/contents/{path} for a single text file. Returns null on 404 (file doesn't exist). */
export async function getFile(path: string): Promise<GitHubFile | null> {
  const entry = await getFileRawEntry(path);
  if (!entry) return null;
  return { path, sha: entry.sha, content: Buffer.from(entry.base64, 'base64').toString('utf-8') };
}

/** List a directory via the Contents API. Returns [] if the directory doesn't exist yet. */
export async function listDir(path: string): Promise<{ name: string; path: string; type: string; sha: string }[]> {
  const { token, owner, repo, branch } = env();
  const res = await fetch(
    `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponentPath(path)}?ref=${encodeURIComponent(branch)}`,
    { headers: headers(token) },
  );
  if (res.status === 404) return [];
  if (!res.ok) await handleErrors(res, `listing ${path}`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data;
}

/** GET binary file (image) raw bytes. Returns null on 404. */
export async function getFileRaw(path: string): Promise<Buffer | null> {
  const entry = await getFileRawEntry(path);
  if (!entry) return null;
  return Buffer.from(entry.base64, 'base64');
}

interface PutResult {
  sha: string;
}

/** Create or update a text file. Pass `sha` (the existing file's sha) to update, omit to create. */
export async function putFile(
  path: string,
  content: string | Buffer,
  message: string,
  sha?: string,
): Promise<PutResult> {
  const { token, owner, repo, branch } = env();
  const contentB64 = Buffer.isBuffer(content) ? content.toString('base64') : Buffer.from(content, 'utf-8').toString('base64');
  const body: Record<string, unknown> = {
    message,
    content: contentB64,
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponentPath(path)}`, {
    method: 'PUT',
    headers: headers(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) await handleErrors(res, `writing ${path}`);
  const data = await res.json();
  return { sha: data.content.sha };
}

/** Delete a file. Requires its current sha (fetch fresh immediately before deleting, don't trust stale list-view SHAs). */
export async function deleteFile(path: string, sha: string, message: string): Promise<void> {
  const { token, owner, repo, branch } = env();
  const res = await fetch(`${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponentPath(path)}`, {
    method: 'DELETE',
    headers: headers(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ message, sha, branch }),
  });
  if (!res.ok) await handleErrors(res, `deleting ${path}`);
}

function encodeURIComponentPath(path: string): string {
  // Encode each path segment but keep the slashes as path separators.
  return path.split('/').map(encodeURIComponent).join('/');
}
