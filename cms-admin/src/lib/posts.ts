import { deleteFile, getFile, listDir, putFile } from './github';
import { parseFrontmatter, serializeMarkdown, type PostFrontmatter } from './frontmatter';

export const CONTENT_DIR = 'content/blog';
export const IMAGES_DIR = 'content/blog/images';

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface LangBlock {
  title: string;
  category: string;
  excerpt: string;
  content: string;
}

export interface PostInput {
  slug: string;
  date: string;
  image: string;
  published: boolean;
  sv: LangBlock;
  en: LangBlock;
}

export interface PublicPost {
  slug: string;
  date: string;
  image: string;
  published: boolean;
  sv: LangBlock;
  en: LangBlock;
}

export interface AdminPostSummary {
  slug: string;
  date: string;
  image: string;
  published: boolean;
  sv: { title: string; category: string; excerpt: string } | null;
  en: { title: string; category: string; excerpt: string } | null;
}

function pathFor(slug: string, lang: 'sv' | 'en'): string {
  return `${CONTENT_DIR}/${slug}.${lang}.md`;
}

export function validateSlug(slug: string): string | null {
  if (!slug || !SLUG_RE.test(slug)) {
    return 'Slug must be lowercase letters/numbers separated by single hyphens (e.g. "my-post-title").';
  }
  return null;
}

export function validateLangBlock(block: Partial<LangBlock> | undefined, lang: string): string | null {
  if (!block) return `Missing ${lang} content block`;
  for (const field of ['title', 'category', 'excerpt', 'content'] as const) {
    if (!block[field] || !String(block[field]).trim()) {
      return `Missing required field "${field}" in ${lang} content block`;
    }
  }
  return null;
}

export function validatePostInput(input: Partial<PostInput>): string | null {
  if (!input.slug) return 'Missing slug';
  const slugErr = validateSlug(input.slug);
  if (slugErr) return slugErr;
  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return 'Missing or invalid date (expected YYYY-MM-DD)';
  if (!input.image) return 'Missing image';
  const svErr = validateLangBlock(input.sv, 'sv');
  if (svErr) return svErr;
  const enErr = validateLangBlock(input.en, 'en');
  if (enErr) return enErr;
  return null;
}

function toFrontmatter(input: PostInput, lang: 'sv' | 'en'): PostFrontmatter {
  const block = input[lang];
  return {
    title: block.title,
    slug: input.slug,
    category: block.category,
    excerpt: block.excerpt,
    date: input.date,
    image: input.image,
    published: input.published,
  };
}

/** Fetch both language files for a slug. Returns null if either is missing. */
export async function getPostPair(slug: string): Promise<PublicPost | null> {
  const [svFile, enFile] = await Promise.all([getFile(pathFor(slug, 'sv')), getFile(pathFor(slug, 'en'))]);
  if (!svFile || !enFile) return null;
  const sv = parseFrontmatter(svFile.content);
  const en = parseFrontmatter(enFile.content);
  return {
    slug,
    date: sv.data.date,
    image: sv.data.image,
    published: sv.data.published,
    sv: { title: sv.data.title, category: sv.data.category, excerpt: sv.data.excerpt, content: sv.content },
    en: { title: en.data.title, category: en.data.category, excerpt: en.data.excerpt, content: en.content },
  };
}

/** List every post (draft + published) for the admin list view. */
export async function listAllPosts(): Promise<AdminPostSummary[]> {
  const entries = await listDir(CONTENT_DIR);
  const mdFiles = entries.filter((e) => e.type === 'file' && /\.(sv|en)\.md$/.test(e.name));

  const bySlug = new Map<string, { sv?: string; en?: string }>();
  for (const f of mdFiles) {
    const m = f.name.match(/^(.*)\.(sv|en)\.md$/);
    if (!m) continue;
    const [, slug, lang] = m;
    const entry = bySlug.get(slug) || {};
    entry[lang as 'sv' | 'en'] = f.path;
    bySlug.set(slug, entry);
  }

  const summaries: AdminPostSummary[] = [];
  await Promise.all(
    Array.from(bySlug.entries()).map(async ([slug, paths]) => {
      const [svFile, enFile] = await Promise.all([
        paths.sv ? getFile(paths.sv) : Promise.resolve(null),
        paths.en ? getFile(paths.en) : Promise.resolve(null),
      ]);
      const sv = svFile ? parseFrontmatter(svFile.content) : null;
      const en = enFile ? parseFrontmatter(enFile.content) : null;
      const primary = sv || en;
      if (!primary) return;
      summaries.push({
        slug,
        date: primary.data.date,
        image: primary.data.image,
        published: primary.data.published,
        sv: sv ? { title: sv.data.title, category: sv.data.category, excerpt: sv.data.excerpt } : null,
        en: en ? { title: en.data.title, category: en.data.category, excerpt: en.data.excerpt } : null,
      });
    }),
  );

  summaries.sort((a, b) => (a.date < b.date ? 1 : -1));
  return summaries;
}

/** Public, published-only lean list (no full content) — one GitHub list + per-file read, no double fetch. */
export async function listPublishedPostsLean(): Promise<
  { slug: string; title: string; category: string; excerpt: string; date: string; image: string }[]
> {
  const all = await listAllPosts();
  return all
    .filter((p) => p.published && p.sv && p.en)
    .map((p) => ({
      slug: p.slug,
      title: p.sv!.title,
      category: p.sv!.category,
      excerpt: p.sv!.excerpt,
      date: p.date,
      image: p.image,
    }));
}

export async function createPost(input: PostInput): Promise<void> {
  const existing = await getPostPair(input.slug);
  if (existing) throw new Error(`A post with slug "${input.slug}" already exists`);

  const svMd = serializeMarkdown(toFrontmatter(input, 'sv'), input.sv.content);
  const enMd = serializeMarkdown(toFrontmatter(input, 'en'), input.en.content);

  // The Contents API only supports one file change per commit, so creating a
  // bilingual post is necessarily two sequential commits (sv, then en) with
  // the client's required message format, rather than one atomic commit.
  // The Git Data API (trees/commits) could batch both into a single atomic
  // commit, but that's meaningfully more code (manual tree/blob/commit/ref
  // plumbing) for an internal tool where "two commits land half a second
  // apart" is a cosmetic concern, not a correctness one — a reader briefly
  // seeing only the sv file isn't reachable from the site's public API since
  // getPostPair() requires BOTH files, so there is no half-published state
  // visible externally. Kept simple on purpose; see report §14.
  await putFile(pathFor(input.slug, 'sv'), svMd, `CMS: add post "${input.sv.title}"`);
  await putFile(pathFor(input.slug, 'en'), enMd, `CMS: add post "${input.sv.title}"`);
}

export async function updatePost(slug: string, input: PostInput): Promise<void> {
  // Re-fetch current SHAs right before writing — never trust SHAs cached
  // from an earlier list view, which may be stale if someone else edited
  // the file (or this same slug) in the meantime.
  const [svFile, enFile] = await Promise.all([getFile(pathFor(slug, 'sv')), getFile(pathFor(slug, 'en'))]);
  if (!svFile || !enFile) throw new Error(`Post "${slug}" not found`);

  const svMd = serializeMarkdown(toFrontmatter(input, 'sv'), input.sv.content);
  const enMd = serializeMarkdown(toFrontmatter(input, 'en'), input.en.content);

  await putFile(pathFor(slug, 'sv'), svMd, `CMS: update post "${input.sv.title}"`, svFile.sha);
  await putFile(pathFor(slug, 'en'), enMd, `CMS: update post "${input.sv.title}"`, enFile.sha);
}

export async function deletePost(slug: string): Promise<void> {
  const [svFile, enFile] = await Promise.all([getFile(pathFor(slug, 'sv')), getFile(pathFor(slug, 'en'))]);
  if (!svFile && !enFile) throw new Error(`Post "${slug}" not found`);

  const title = svFile ? parseFrontmatter(svFile.content).data.title : slug;

  if (svFile) await deleteFile(pathFor(slug, 'sv'), svFile.sha, `CMS: delete post "${title}"`);
  if (enFile) await deleteFile(pathFor(slug, 'en'), enFile.sha, `CMS: delete post "${title}"`);

  // Clean up any images uploaded for this post.
  const imageDir = `${IMAGES_DIR}/${slug}`;
  const images = await listDir(imageDir);
  await Promise.all(
    images
      .filter((img) => img.type === 'file')
      .map((img) => deleteFile(img.path, img.sha, `CMS: delete post "${title}" (image ${img.name})`)),
  );
}
