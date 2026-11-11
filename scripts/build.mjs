import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(resolve(root, '.openai/hosting.json'), 'utf8'));
if (!manifest.project_id) throw new Error('A registered Site is required.');
const bundled = await build({ entryPoints: [resolve(root, 'worker/index.js')], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', write: false });
const source = bundled.outputFiles[0].text;
const module = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
if (typeof module.default?.fetch !== 'function') throw new Error('Worker fetch export is missing.');
await rm(resolve(root, 'dist'), { recursive: true, force: true });
await mkdir(resolve(root, 'dist/server'), { recursive: true });
await mkdir(resolve(root, 'dist/.openai'), { recursive: true });
await writeFile(resolve(root, 'dist/server/index.js'), source);
await cp(resolve(root, '.openai/hosting.json'), resolve(root, 'dist/.openai/hosting.json'));
await cp(resolve(root, 'drizzle'), resolve(root, 'dist/drizzle'), { recursive: true });
console.log('Built and validated the Worker ESM artifact with D1 migrations.');
