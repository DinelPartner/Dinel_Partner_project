# Din Elpartner — CMS admin (separate app)

A small, standalone Astro app that is the blog admin panel. It is **not**
part of the main dinelpartner.se Astro project (`../src`) — it's deployed as
its own Vercel project, with content stored as Markdown files in this same
git repository (`../content/blog/`), read/written through the GitHub
Contents API. No database. No Decap/Sveltia/Netlify CMS.

## Why a subfolder in the same repo (not a separate repo)

- One GitHub repo is simpler for the client to manage than two.
- Vercel natively supports a monorepo: set this project's **Root Directory**
  to `cms-admin` in the Vercel dashboard and it builds/deploys independently
  from the main site, with its own env vars.
- The content this panel manages (`../content/blog/`) lives in the very same
  repo it already needs GitHub API access to, so there's no cross-repo token
  or permissions story to manage.

## Local setup

```bash
cd cms-admin
npm install
cp .env.example .env   # fill in real values
npm run dev
```

## Deploying

1. In Vercel: "Add New Project" → import this same GitHub repo.
2. Set **Root Directory** to `cms-admin`.
3. Framework preset: Astro (auto-detected).
4. Add the environment variables from `.env.example` (see below) in the
   Vercel project settings.
5. Deploy. Note the resulting `*.vercel.app` (or custom) domain — the main
   site's `public/aktuellt-proxy.php` needs it (see repo root README).

## Environment variables

| Variable | Purpose |
|---|---|
| `GITHUB_TOKEN` | Fine-grained PAT, scoped to this one repo, "Contents: Read and write" only. Server-side only, never sent to the browser. |
| `GITHUB_OWNER` | GitHub username/org that owns the repo. |
| `GITHUB_REPO` | Repo name. |
| `GITHUB_BRANCH` | Branch to read/write (`main`). |
| `ADMIN_PASSWORD` | Shared password for the single login form. |
| `SESSION_SECRET` | Random secret used to HMAC-sign the session cookie (`openssl rand -hex 32`). |
| `ALLOWED_ORIGIN` | Optional extra CORS origin (staging) besides the two production dinelpartner.se origins. |

## How it works

- **Storage**: one Markdown file per language per post, at
  `content/blog/<slug>.sv.md` and `content/blog/<slug>.en.md` (repo root).
  Images live at `content/blog/images/<slug>/<file>`.
- **Auth**: a single shared password (`POST /api/login`) sets an HttpOnly,
  Secure, signed cookie (HMAC-SHA256 over an expiry timestamp, using
  `SESSION_SECRET`). This replaces PHP's `$_SESSION` — serverless functions
  have no persistent process to hold session state in, so a signed,
  stateless cookie is the standard substitute, not a downgrade.
- **Admin endpoints** (`/api/admin/*`) all call `requireAuth()` server-side;
  there is no client-only gate.
- **Public endpoints** (`GET /api/posts`, `GET /api/posts/[slug]`) are
  read-only, published-only, CORS-restricted to the dinelpartner.se origins,
  and cached via `Cache-Control: s-maxage=60` (Vercel edge cache) plus a
  best-effort in-memory `Map` (cleared on every write, but not relied upon —
  Vercel functions are not guaranteed to stay warm).
- Every GitHub write is one commit with message `CMS: add/update/delete post
  "<title>"`. Creating a bilingual post is two sequential commits (one per
  language file) because the Contents API only supports one file per commit;
  see the comment in `src/lib/posts.ts` for why that's an acceptable
  trade-off here rather than reaching for the Git Data API.
