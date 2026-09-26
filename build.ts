import { cp, mkdir, readdir, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { highlight } from './highlight.ts';

export const SITE = 'https://andreacanton.dev';

export const escapeHtml = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const render = (tpl: string, vars: Record<string, string>) =>
  tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');

type Post = {
  slug: string;
  date: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  content: string;
};

const fmtDate = (iso: string) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).replace(/\./g, '');

const ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" class="date"><path class="icon" d="M21 3h-3V1h-2v2H8V1H6v2H3v18h18V3zm-2 16H5V8h14v11zM7 10h5v5H7v-5z"></path></svg>`;

const addIds = (html: string) => {
  const seen = new Map<string, number>();
  return html.replace(/<(h[23])>([\s\S]*?)<\/\1>/g, (_, tag, inner) => {
    let id = inner.replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, '').toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s/g, '-');
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    if (n) id += `-${n}`;
    return `<${tag} id="${id}">${inner}</${tag}>`;
  });
};

// Bun.markdown has no footnotes: collect `[^id]: text` definitions, number the
// references in order of appearance and render the GFM-style markup Astro used.
const renderMarkdown = (md: string) => {
  const defs = new Map<string, string>();
  md = md.replace(/^\[\^([^\]\s]+)\]:[ \t]*(.*)$/gm, (_, id, text) => {
    defs.set(id, text.trim());
    return '';
  });
  const order: string[] = [];
  md = md.replace(/\[\^([^\]\s]+)\](?!:)/g, (all, id) => {
    if (!defs.has(id)) return all;
    if (!order.includes(id)) order.push(id);
    const n = order.indexOf(id) + 1;
    return `<sup><a href="#user-content-fn-${n}" id="user-content-fnref-${n}" data-footnote-ref="true" aria-describedby="footnote-label">${n}</a></sup>`;
  });
  let html = Bun.markdown.html(md);
  if (order.length) {
    const items = order.map((id, i) => {
      const n = i + 1;
      const text = Bun.markdown.html(defs.get(id)!).trim().replace(/^<p>|<\/p>$/g, '');
      return `<li id="user-content-fn-${n}">\n<p>${text} <a href="#user-content-fnref-${n}" data-footnote-backref aria-label="Back to reference ${n}" class="data-footnote-backref">↩</a></p>\n</li>`;
    });
    html += `<section data-footnotes="true" class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes</h2>\n<ol>\n${items.join('\n')}\n</ol>\n</section>`;
  }
  return html;
};

async function readPosts(dir: string): Promise<Post[]> {
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }
  const posts: Post[] = [];
  for (const file of files) {
    const m = file.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
    if (!m) throw new Error(`${dir}/${file}: name must be YYYY-MM-DD-slug.md`);
    const raw = await Bun.file(join(dir, file)).text();
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    const data = ((fm ? Bun.YAML.parse(fm[1]) : null) ?? {}) as Record<string, unknown>;
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    if (!title) throw new Error(`${dir}/${file}: missing "title" in frontmatter`);
    posts.push({
      date: m[1],
      slug: m[2],
      title,
      subtitle: data.subtitle ? String(data.subtitle) : '',
      description: data.description ? String(data.description) : '',
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      content: highlight(addIds(renderMarkdown(fm ? fm[2] : raw))),
    });
  }
  return posts;
}

const HOME_DESC = 'Website of Andrea Canton a vegetarian fullstack developer based in Verona, Italy.';
const BLOG_DESC = "Hi! This is my personal blog. Here you can find some articles about life, software development and something about me. First thing about me: I'm not constant in writing and I don't remember how many times I've started a blog.";
const HOME_TITLE = 'Senior Software Engineer // Andrea Canton';
const TMP = 'dist.tmp';
const RELOAD = `<script>new EventSource('/__reload').onmessage=()=>location.reload()</script>`;

export async function build({ drafts = false, dev = false } = {}) {
  const read = (p: string) => Bun.file(p).text();
  const [base, header, footer, postTpl, blogTpl, style] = await Promise.all(
    ['base', 'header', 'footer', 'post', 'blog'].map((n) => read(`templates/${n}.html`)).concat(read('style.css')),
  );
  const published = await readPosts('blog');
  const all = drafts ? [...published, ...(await readPosts('drafts'))] : published;
  all.sort((a, b) => b.date.localeCompare(a.date));

  const wrap = (page: string, title: string, description: string, body: string) => {
    const html = render(base, {
      title: escapeHtml(title),
      description: escapeHtml(description),
      style,
      page,
      body,
    });
    return dev ? html.replace('</body>', `${RELOAD}</body>`) : html;
  };
  const write = async (path: string, html: string) => {
    await mkdir(join(TMP, path, '..'), { recursive: true });
    await Bun.write(join(TMP, path), html);
  };

  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });
  try {
    await emit();
  } catch (err) {
    await rm(TMP, { recursive: true, force: true });
    throw err;
  }
  await rm('dist', { recursive: true, force: true });
  await rename(TMP, 'dist');

  async function emit() {
  await cp('public', TMP, { recursive: true });

  for (const p of all) {
    const body = render(postTpl, {
      header,
      dateIso: p.date + 'T00:00:00.000Z',
      icon: ICON,
      date: fmtDate(p.date),
      title: escapeHtml(p.title),
      subtitle: p.subtitle ? `<p class="subtitle">${escapeHtml(p.subtitle)}</p>` : '',
      content: p.content,
      footer,
    });
    await write(`blog/${p.slug}/index.html`, wrap('post', `${p.title} ~ Andrea Canton`, p.description || p.subtitle, body));
  }

  const items = all
    .map(
      (p) => `<article>
      <div class="meta"><span class="article-date">${ICON}<time datetime="${p.date}T00:00:00.000Z">${fmtDate(p.date)}</time></span></div>
      <h2><a href="/blog/${escapeHtml(p.slug)}/">${escapeHtml(p.title)}</a></h2>
      ${p.subtitle ? `<p class="subtitle">${escapeHtml(p.subtitle)}</p>` : ''}
      ${p.tags.length ? `<p class="tags">${escapeHtml(p.tags.join(', '))}</p>` : ''}
    </article>`,
    )
    .join('\n');
  const blogBody = render(blogTpl, { header, count: String(all.length), posts: items, footer });
  await write('blog/index.html', wrap('blog', 'Blog ~ Andrea Canton', BLOG_DESC, blogBody));

  for (const [file, page, title] of [
    ['index.html', 'home', HOME_TITLE],
    ['404.html', 'not-found', HOME_TITLE],
  ] as const) {
    const src = await read(`pages/${file}`);
    const body = render(src, { header, footer });
    await write(file, wrap(page, title, HOME_DESC, body));
  }

  const pub = published.slice().sort((a, b) => b.date.localeCompare(a.date));
  const urls = ['/', '/blog/', ...pub.map((p) => `/blog/${p.slug}/`)];
  await write(
    'sitemap-index.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${SITE}/sitemap-0.xml</loc></sitemap></sitemapindex>\n`,
  );
  await write(
    'sitemap-0.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
      .map((u) => `<url><loc>${escapeHtml(SITE + u)}</loc></url>`)
      .join('')}</urlset>\n`,
  );
  const rssItems = pub
    .slice(0, 20)
    .map(
      (p) => `<item><title>${escapeHtml(p.title)}</title><link>${escapeHtml(`${SITE}/blog/${p.slug}/`)}</link><guid isPermaLink="true">${escapeHtml(`${SITE}/blog/${p.slug}/`)}</guid><pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate><description>${escapeHtml(p.description || p.subtitle)}</description></item>`,
    )
    .join('\n');
  await write(
    'feed.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Andrea Canton</title><link>${SITE}/</link><description>Articles by Andrea Canton</description>\n${rssItems}\n</channel></rss>\n`,
  );
  }
}

if (import.meta.main) {
  await build({ drafts: process.argv.includes('--drafts') });
}
