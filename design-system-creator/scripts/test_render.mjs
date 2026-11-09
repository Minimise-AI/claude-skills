// Run after the renderer's documented Playwright setup: node scripts/test_render.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const renderer = fileURLToPath(new URL('./render.mjs', import.meta.url));
const root = await mkdtemp(path.join(tmpdir(), 'svg-render-test-'));
const input = path.join(root, 'sample.svg');
const run = (...args) => spawnSync(process.execPath, [renderer, input, ...args], {
  encoding: 'utf8', timeout: 30000,
});
try {
  // Ordinary vector geometry and an embedded raster; no external resources.
  await writeFile(input, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20">
    <rect width="20" height="20" fill="#0066cc"/>
    <image x="20" width="20" height="20" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg=="/>
  </svg>`);
  const rendered = run('--bg', '#ffffff');
  assert.equal(rendered.status, 0, rendered.stderr || String(rendered.error));
  const png = await readFile(path.join(root, 'sample.png'));
  const jpg = await readFile(path.join(root, 'sample.jpg'));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [160, 80]);
  assert.equal(jpg.subarray(0, 3).toString('hex'), 'ffd8ff');
  for (const args of [['--bg', 'not-a-colour'], ['--width', '0'], ['--height', '2px']]) {
    const rejected = run(...args);
    assert.notEqual(rejected.status, 0, `Accepted invalid arguments: ${args}`);
    assert.match(rejected.stderr, /must be/);
  }
  await writeFile(input, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9000 9000"/>');
  const oversized = run();
  assert.notEqual(oversized.status, 0);
  assert.match(oversized.stderr, /Render exceeds/);
  await writeFile(input, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><!--' + ' '.repeat(16 * 1024 * 1024) + '--></svg>');
  const largeSource = run();
  assert.notEqual(largeSource.status, 0);
  assert.match(largeSource.stderr, /no larger than 16 MiB/);
  console.log('PASS: offline SVG outputs, dimensions, invalid arguments, raster and source limits');
} finally {
  await rm(root, { recursive: true, force: true });
}
