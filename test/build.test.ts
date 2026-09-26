import { afterEach, describe, expect, test } from 'bun:test';
import { build, escapeHtml, render } from '../build.ts';
import { makeSite, post } from './fixture.ts';

describe('escapeHtml', () => {
  test('escapes the five HTML special characters', () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;'
    );
  });
});

describe('render', () => {
  test('replaces placeholders and blanks unknown ones', () => {
    expect(render('<p>{{a}} {{b}} {{a}}</p>', { a: 'x' })).toBe('<p>x  x</p>');
  });

  test('does not re-expand placeholders inside values', () => {
    expect(render('{{a}}', { a: '{{b}}', b: 'no' })).toBe('{{b}}');
  });
});

describe('build', () => {
  const cwd = process.cwd();
  let site: Awaited<ReturnType<typeof makeSite>>;

  const buildIn = async (
    files: Record<string, string>,
    opts?: Parameters<typeof build>[0]
  ) => {
    site = await makeSite(files);
    process.chdir(site.dir);
    await build(opts);
  };

  afterEach(async () => {
    process.chdir(cwd);
    await site?.cleanup();
  });

  test('renders a post with title, subtitle, date and canonical', async () => {
    await buildIn({
      'blog/2024-03-05-hello.md': post(
        'title: Hello & welcome\nsubtitle: A <first> post\ndescription: Desc',
        'Some *text*.'
      ),
    });
    const html = await site.read('dist/blog/hello/index.html');
    expect(html).toContain(
      '<title>Hello &amp; welcome ~ Andrea Canton</title>'
    );
    expect(html).toContain('<h1>Hello &amp; welcome</h1>');
    expect(html).toContain('<p class="subtitle">A &lt;first&gt; post</p>');
    expect(html).toContain('<meta name="description" content="Desc">');
    expect(html).toContain(
      '<time datetime="2024-03-05T00:00:00.000Z">5 mar 2024</time>'
    );
    expect(html).toContain(
      '<link rel="canonical" href="https://andreacanton.dev/blog/hello/">'
    );
    expect(html).toContain(
      '<meta property="og:url" content="https://andreacanton.dev/blog/hello/">'
    );
    expect(html).toContain('<em>text</em>');
    expect(html).toContain('<body class="post">');
    expect(html).not.toContain('{{');
    expect(html).not.toContain('__reload');
  });

  test('falls back to subtitle, then to the default description', async () => {
    await buildIn({
      'blog/2024-01-01-a.md': post('title: A\nsubtitle: Sub A'),
      'blog/2024-01-02-b.md': post('title: B'),
    });
    expect(await site.read('dist/blog/a/index.html')).toContain(
      '<meta name="description" content="Sub A">'
    );
    expect(await site.read('dist/blog/b/index.html')).toContain(
      '<meta name="description" content="Website of Andrea Canton'
    );
  });

  test('adds unique ids to h2/h3 headings, ignoring inline tags and entities', async () => {
    await buildIn({
      'blog/2024-01-01-a.md': post(
        'title: A',
        '## Hello `code` *World*\n\n## Hello code World\n\n## Tom & Jerry\n\n### Perché no?\n\n#### Skipped\n'
      ),
    });
    const html = await site.read('dist/blog/a/index.html');
    const ids = [...html.matchAll(/<(h\d) id="([^"]*)">/g)].map(
      (m) => `${m[1]}#${m[2]}`
    );
    expect(ids).toEqual([
      'h2#hello-code-world',
      'h2#hello-code-world-1',
      'h2#tom--jerry',
      'h3#perché-no',
    ]);
  });

  test('renders footnotes numbered by first reference', async () => {
    await buildIn({
      'blog/2024-01-01-a.md': post(
        'title: A',
        'First[^b] then[^a] again[^b] and[^missing].\n\n[^a]: Note A\n[^b]: Note *B*\n'
      ),
    });
    const html = await site.read('dist/blog/a/index.html');
    expect(html).toContain(
      'First<sup><a href="#user-content-fn-1" id="user-content-fnref-1"'
    );
    expect(html).toContain(
      'then<sup><a href="#user-content-fn-2" id="user-content-fnref-2"'
    );
    expect(html).toContain('and[^missing]');
    expect(html).toContain(
      '<li id="user-content-fn-1">\n<p>Note <em>B</em> <a href="#user-content-fnref-1"'
    );
    expect(html).toContain('<li id="user-content-fn-2">\n<p>Note A <a');
    expect(html).not.toContain('[^a]:');
  });

  test('highlights TypeScript code blocks', async () => {
    await buildIn({
      'blog/2024-01-01-a.md': post('title: A', '```ts\nconst x = 1;\n```\n'),
    });
    const html = await site.read('dist/blog/a/index.html');
    expect(html).toContain(
      '<pre><code class="language-ts"><span class="tok-keyword">const</span> x = <span class="tok-number">1</span>;'
    );
  });

  test('lists posts newest first on the blog index', async () => {
    await buildIn({
      'blog/2023-01-01-old.md': post('title: Old\ntags: [a, b]'),
      'blog/2025-01-01-new.md': post('title: New'),
    });
    const html = await site.read('dist/blog/index.html');
    expect(html.indexOf('/blog/new/')).toBeLessThan(html.indexOf('/blog/old/'));
    expect(html).toContain('<p class="tags">a, b</p>');
    expect(html).toContain('Here my only 2 articles');
    expect(html).toContain(
      '<link rel="canonical" href="https://andreacanton.dev/blog/">'
    );
  });

  test('builds home and 404, with canonical only on home', async () => {
    await buildIn({});
    const home = await site.read('dist/index.html');
    const notFound = await site.read('dist/404.html');
    expect(home).toContain('<body class="home">');
    expect(home).toContain(
      '<link rel="canonical" href="https://andreacanton.dev/">'
    );
    expect(notFound).toContain('<body class="not-found">');
    expect(notFound).not.toContain('rel="canonical"');
    expect(notFound).not.toContain('og:url');
  });

  test('copies public/ as-is', async () => {
    await buildIn({ 'public/images/x.txt': 'hi' });
    expect(await site.read('dist/robots.txt')).toBe('User-agent: *\n');
    expect(await site.read('dist/images/x.txt')).toBe('hi');
  });

  test('writes sitemap and RSS feed with published posts only', async () => {
    await buildIn(
      {
        'blog/2024-01-01-a.md': post('title: A & B\ndescription: About <A>'),
        'drafts/2024-02-01-draft.md': post('title: Draft'),
      },
      { drafts: true }
    );
    const sitemap = await site.read('dist/sitemap-0.xml');
    expect(sitemap).toContain('<loc>https://andreacanton.dev/</loc>');
    expect(sitemap).toContain('<loc>https://andreacanton.dev/blog/a/</loc>');
    expect(sitemap).not.toContain('draft');
    expect(await site.read('dist/sitemap-index.xml')).toContain(
      'https://andreacanton.dev/sitemap-0.xml'
    );

    const feed = await site.read('dist/feed.xml');
    expect(feed).toContain('<title>A &amp; B</title>');
    expect(feed).toContain('<description>About &lt;A&gt;</description>');
    expect(feed).toContain('<pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>');
    expect(feed).not.toContain('Draft');
  });

  test('limits the RSS feed to the 20 newest posts', async () => {
    const files: Record<string, string> = {};
    for (let i = 1; i <= 25; i++) {
      const d = String(i).padStart(2, '0');
      files[`blog/2024-01-${d}-p${d}.md`] = post(`title: P${d}`);
    }
    await buildIn(files);
    const feed = await site.read('dist/feed.xml');
    expect(feed.match(/<item>/g)).toHaveLength(20);
    expect(feed).toContain('<title>P25</title>');
    expect(feed).not.toContain('<title>P05</title>');
  });

  test('includes drafts only with the drafts option', async () => {
    const files = { 'drafts/2024-02-01-wip.md': post('title: WIP') };
    await buildIn(files);
    expect(await site.exists('dist/blog/wip/index.html')).toBe(false);
    await site.cleanup();
    await buildIn(files, { drafts: true });
    expect(await site.exists('dist/blog/wip/index.html')).toBe(true);
    expect(await site.read('dist/blog/index.html')).toContain('/blog/wip/');
  });

  test('works without blog/ and drafts/ folders', async () => {
    await buildIn({}, { drafts: true });
    expect(await site.read('dist/blog/index.html')).toContain(
      'Here my only 0 articles'
    );
  });

  test('injects the live reload script in dev mode', async () => {
    await buildIn({}, { dev: true });
    expect(await site.read('dist/index.html')).toContain(
      "new EventSource('/__reload')"
    );
  });

  test('rejects badly named post files', async () => {
    await expect(
      buildIn({ 'blog/hello.md': post('title: A') })
    ).rejects.toThrow('name must be YYYY-MM-DD-slug.md');
  });

  test('rejects posts without a title', async () => {
    await expect(
      buildIn({ 'blog/2024-01-01-a.md': post('subtitle: x') })
    ).rejects.toThrow('missing "title"');
  });

  test('keeps the previous dist/ when a build fails', async () => {
    await buildIn({ 'blog/2024-01-01-a.md': post('title: A') });
    await site.write({ 'blog/2024-01-02-b.md': post('subtitle: no title') });
    await expect(build()).rejects.toThrow();
    expect(await site.exists('dist/blog/a/index.html')).toBe(true);
    expect(await site.exists('dist.tmp')).toBe(false);
  });
});
