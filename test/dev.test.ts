import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { Subprocess } from 'bun';
import { join } from 'node:path';
import { ROOT, makeSite, post } from './fixture.ts';

let site: Awaited<ReturnType<typeof makeSite>>;
let server: Subprocess<'ignore', 'pipe', 'pipe'>;
let base: string;

const freePort = () => {
  const s = Bun.serve({ port: 0, fetch: () => new Response() });
  const { port } = s;
  s.stop(true);
  return port;
};

// Resolves once the accumulated text of `stream` contains `needle`.
async function waitFor(
  stream: ReadableStream<Uint8Array>,
  needle: string,
  ms = 3000
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = '';
  const timeout = setTimeout(() => reader.cancel(), ms);
  try {
    while (!text.includes(needle)) {
      const { value, done } = await reader.read();
      if (done)
        throw new Error(`stream ended before "${needle}", got: ${text}`);
      text += decoder.decode(value, { stream: true });
    }
    return text;
  } finally {
    clearTimeout(timeout);
    reader.releaseLock();
  }
}

// Opens the live reload stream and waits until the server has registered it.
async function connectReload() {
  const ctrl = new AbortController();
  const res = await fetch(`${base}/__reload`, { signal: ctrl.signal });
  expect(res.headers.get('content-type')).toBe('text/event-stream');
  await waitFor(res.body!, ': connected');
  return { body: res.body!, close: () => ctrl.abort() };
}

beforeAll(async () => {
  site = await makeSite({
    'blog/2024-01-01-hello.md': post('title: Hello', 'First version'),
    'public/images/pic.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
    'secret.txt': 'top secret',
  });
  const port = freePort();
  base = `http://localhost:${port}`;
  server = Bun.spawn(['bun', join(ROOT, 'dev.ts')], {
    cwd: site.dir,
    env: { ...process.env, PORT: String(port) },
    stdout: 'pipe',
    stderr: 'pipe',
  });
  await waitFor(server.stdout, 'dev server on');
});

afterAll(async () => {
  server?.kill();
  await server?.exited;
  await site?.cleanup();
});

describe('dev server', () => {
  test('builds with live reload on startup', async () => {
    const res = await fetch(`${base}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toStartWith('text/html');
    expect(await res.text()).toContain("new EventSource('/__reload')");
  });

  test('serves a directory index with and without trailing slash', async () => {
    for (const path of ['/blog/hello/', '/blog/hello']) {
      const res = await fetch(base + path);
      expect(res.status).toBe(200);
      expect(await res.text()).toContain('First version');
    }
  });

  test('serves static files with their content type', async () => {
    const res = await fetch(`${base}/images/pic.svg`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toStartWith('image/svg+xml');
  });

  test('serves the 404 page for missing paths and bare directories', async () => {
    for (const path of ['/nope', '/images/', '/images']) {
      const res = await fetch(base + path);
      expect(res.status).toBe(404);
      expect(await res.text()).toContain('<body class="not-found">');
    }
  });

  test('does not serve files outside dist/', async () => {
    for (const path of [
      '/%2e%2e/secret.txt',
      '/..%2fsecret.txt',
      '/%2e%2e%2f%2e%2e%2fsecret.txt',
    ]) {
      const res = await fetch(base + path);
      expect(res.status).toBe(404);
      expect(await res.text()).not.toContain('top secret');
    }
  });

  test('answers 404 to malformed URLs', async () => {
    const res = await fetch(`${base}/%E0%A4%A`);
    expect(res.status).toBe(404);
  });

  test('rebuilds and notifies clients when a post changes', async () => {
    const reload = await connectReload();
    await site.write({
      'blog/2024-01-01-hello.md': post('title: Hello', 'Second version'),
    });
    await waitFor(reload.body, 'data: reload');
    reload.close();
    expect(await (await fetch(`${base}/blog/hello/`)).text()).toContain(
      'Second version'
    );
  });

  test('rebuilds when style.css changes', async () => {
    const reload = await connectReload();
    await site.write({ 'style.css': 'body { color: rebeccapurple; }' });
    await waitFor(reload.body, 'data: reload');
    reload.close();
    expect(await (await fetch(`${base}/`)).text()).toContain('rebeccapurple');
  });

  // drafts/ is not in the fixture: git doesn't keep empty folders, so it may
  // only be created after the server started.
  test('picks up drafts in a folder created after startup', async () => {
    const reload = await connectReload();
    await site.write({ 'drafts/2024-03-01-new.md': post('title: New draft') });
    await waitFor(reload.body, 'data: reload');
    reload.close();
    expect((await fetch(`${base}/blog/new/`)).status).toBe(200);
  });

  test('does not rebuild on its own output', async () => {
    const reload = await connectReload();
    await site.write({ 'secret.txt': 'still secret' });
    await Bun.sleep(500);
    await expect(waitFor(reload.body, 'data: reload', 500)).rejects.toThrow();
    reload.close();
  });

  test('keeps serving the last good build when a rebuild fails', async () => {
    const reload = await connectReload();
    await site.write({
      'blog/2024-01-01-hello.md': post('subtitle: no title'),
    });
    await waitFor(server.stderr, 'rebuild failed');
    expect(await (await fetch(`${base}/blog/hello/`)).text()).toContain(
      'Second version'
    );

    await site.write({
      'blog/2024-01-01-hello.md': post('title: Hello', 'Fixed version'),
    });
    await waitFor(reload.body, 'data: reload');
    reload.close();
    expect(await (await fetch(`${base}/blog/hello/`)).text()).toContain(
      'Fixed version'
    );
  });

  test('survives clients that disconnect', async () => {
    const gone = await connectReload();
    gone.close();
    const reload = await connectReload();
    await site.write({
      'blog/2024-01-01-hello.md': post('title: Hello', 'After disconnect'),
    });
    await waitFor(reload.body, 'data: reload');
    reload.close();
    expect(server.exitCode).toBeNull();
    expect(await (await fetch(`${base}/blog/hello/`)).text()).toContain(
      'After disconnect'
    );
  });
});
