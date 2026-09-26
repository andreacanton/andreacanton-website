import { watch } from 'node:fs';
import { join, normalize } from 'node:path';
import { build } from './build.ts';

const PORT = Number(process.env.PORT ?? 3000);
const clients = new Set<ReadableStreamDefaultController<string>>();

async function rebuild() {
  try {
    await build({ drafts: true, dev: true });
    for (const c of clients) c.enqueue('data: reload\n\n');
  } catch (err) {
    console.error('rebuild failed:', err);
  }
}

await rebuild();

const resolve = async (pathname: string) => {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const candidates = [rel, join(rel, 'index.html')];
  for (const c of candidates) {
    const f = Bun.file(join('dist', c));
    if (c.endsWith('/') ? false : await f.exists()) {
      if (f.type && (await f.stat()).isFile()) return f;
    }
  }
  return null;
};

Bun.serve({
  port: PORT,
  async fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname === '/__reload') {
      let ctrl: ReadableStreamDefaultController<string>;
      const stream = new ReadableStream<string>({
        start(c) {
          ctrl = c;
          clients.add(c);
          c.enqueue(': connected\n\n');
        },
        cancel() {
          clients.delete(ctrl);
        },
      });
      return new Response(stream, {
        headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
      });
    }
    const file = await resolve(pathname).catch(() => null);
    if (file) return new Response(file);
    return new Response(Bun.file('dist/404.html'), { status: 404 });
  },
  idleTimeout: 0,
});
console.log(`dev server on http://localhost:${PORT}`);

let timer: Timer | undefined;
let running = false;
let again = false;
const schedule = () => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    if (running) return void (again = true);
    running = true;
    do {
      again = false;
      await rebuild();
    } while (again);
    running = false;
  }, 100);
};
for (const p of ['blog', 'drafts', 'pages', 'templates', 'public']) {
  watch(p, { recursive: true }, schedule);
}
// Watch the root dir, not the file: editors that save by replacing the file
// would leave a file watcher attached to the old inode.
watch('.', (_, file) => file === 'style.css' && schedule());
