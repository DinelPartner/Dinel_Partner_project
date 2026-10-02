/**
 * Minimal hand-rolled YAML-frontmatter parser/serializer for our own
 * controlled, flat frontmatter shape (string/boolean/date scalars only, no
 * nesting, no lists). Chosen over adding `gray-matter` as a dependency: our
 * frontmatter is simple and fully owned by this app (nothing else writes
 * these files), so a ~40-line parser is easy to verify correct and keeps the
 * "minimal dependencies" mandate. If the frontmatter shape ever grows nested
 * structures, switching to gray-matter + a real YAML parser would be the
 * right call at that point.
 */

export interface PostFrontmatter {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  date: string; // YYYY-MM-DD
  image: string;
  published: boolean;
}

export interface ParsedMarkdown {
  data: PostFrontmatter;
  content: string;
}

const FENCE = '---';

export function parseFrontmatter(raw: string): ParsedMarkdown {
  const normalized = raw.replace(/\r\n/g, '\n');
  if (!normalized.startsWith(FENCE)) {
    throw new Error('Markdown file is missing a frontmatter block');
  }
  const end = normalized.indexOf(`\n${FENCE}`, FENCE.length);
  if (end === -1) {
    throw new Error('Malformed frontmatter: closing --- not found');
  }
  const fmBlock = normalized.slice(FENCE.length, end).trim();
  const content = normalized.slice(end + `\n${FENCE}`.length).replace(/^\n+/, '');

  const data: Record<string, string | boolean> = {};
  for (const line of fmBlock.split('\n')) {
    if (!line.trim()) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value === 'true' || value === 'false') {
      data[key] = value === 'true';
      continue;
    }
    // Strip a single layer of surrounding quotes (we always write quoted
    // strings, but tolerate unquoted values too).
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }

  const required = ['title', 'slug', 'category', 'excerpt', 'date', 'image'] as const;
  for (const key of required) {
    if (typeof data[key] !== 'string') {
      throw new Error(`Frontmatter missing required field: ${key}`);
    }
  }

  return {
    data: {
      title: data.title as string,
      slug: data.slug as string,
      category: data.category as string,
      excerpt: data.excerpt as string,
      date: data.date as string,
      image: data.image as string,
      published: data.published === true,
    },
    content,
  };
}

function yamlQuote(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function serializeMarkdown(data: PostFrontmatter, content: string): string {
  const lines = [
    FENCE,
    `title: ${yamlQuote(data.title)}`,
    `slug: ${yamlQuote(data.slug)}`,
    `category: ${yamlQuote(data.category)}`,
    `excerpt: ${yamlQuote(data.excerpt)}`,
    `date: ${yamlQuote(data.date)}`,
    `image: ${yamlQuote(data.image)}`,
    `published: ${data.published ? 'true' : 'false'}`,
    FENCE,
    '',
    content.trim(),
    '',
  ];
  return lines.join('\n');
}
