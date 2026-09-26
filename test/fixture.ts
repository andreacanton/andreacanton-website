import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export const ROOT = join(import.meta.dir, '..');

// Creates a throwaway site with the real templates, pages and stylesheet, a
// minimal public/ and the given extra files (e.g. blog posts).
export async function makeSite(files: Record<string, string> = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'site-test-'));
  await Promise.all([
    cp(join(ROOT, 'templates'), join(dir, 'templates'), { recursive: true }),
    cp(join(ROOT, 'pages'), join(dir, 'pages'), { recursive: true }),
    cp(join(ROOT, 'style.css'), join(dir, 'style.css')),
  ]);
  await writeFiles(dir, { 'public/robots.txt': 'User-agent: *\n', ...files });
  return {
    dir,
    read: (p: string) => Bun.file(join(dir, p)).text(),
    exists: (p: string) => Bun.file(join(dir, p)).exists(),
    write: (f: Record<string, string>) => writeFiles(dir, f),
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
}

async function writeFiles(dir: string, files: Record<string, string>) {
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(dir, path)), { recursive: true });
    await writeFile(join(dir, path), content);
  }
}

export const post = (fm: string, body = '') => `---\n${fm}\n---\n${body}`;
