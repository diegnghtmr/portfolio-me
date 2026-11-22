// Favicon set from design/favicon/02-bayer-sphere.html (odd T23).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root));
const INK = [0x7f, 0xb4, 0xca];
const SURFACE = [0x06, 0x08, 0x0f];
const pixel = async (png, x, y) => {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const o = (y * info.width + x) * info.channels;
  return [data[o], data[o + 1], data[o + 2]];
};

test('favicon.svg is the 32 px pixel-grid sphere with the brand inks only', async () => {
  const svg = (await read('public/favicon.svg')).toString();
  assert.match(svg, /viewBox="0 0 32 32"/);
  assert.match(svg, /shape-rendering="crispEdges"/);
  const colours = new Set(svg.match(/#[0-9a-f]{6}/gi).map((c) => c.toLowerCase()));
  assert.deepEqual([...colours].sort(), ['#06080f', '#27345c', '#7fb4ca', '#f3f6f9']);
});

test('raster icons have the expected sizes and crisp brand pixels', async () => {
  const cases = [
    ['public/apple-touch-icon.png', 180],
    ['public/icon-192.png', 192],
    ['public/icon-512.png', 512],
    ['public/icon-maskable-512.png', 512],
  ];
  for (const [path, size] of cases) {
    const png = await read(path);
    const { format, width, height } = await sharp(png).metadata();
    assert.deepEqual([format, width, height], ['png', size, size], path);
  }
  // Maskable: content inside the 80% safe zone, plain surface at the edge.
  const maskable = await read('public/icon-maskable-512.png');
  assert.deepEqual(await pixel(maskable, 4, 256), SURFACE);
  assert.deepEqual(await pixel(maskable, 256, 4), SURFACE);
});

test('favicon.ico holds the hand-drawn 16 px and the 32 px icons', async () => {
  const ico = await read('public/favicon.ico');
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 2);
  const sizes = [];
  for (let i = 0; i < 2; i++) {
    const entry = 6 + i * 16;
    const size = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    const png = ico.subarray(offset, offset + size);
    const { width, height } = await sharp(png).metadata();
    sizes.push([ico[entry] || 256, width, height]);
    if (width === 16) assert.deepEqual(await pixel(png, 7, 8), INK, '16 px body is solid ink');
  }
  assert.deepEqual(sizes, [[16, 16, 16], [32, 32, 32]]);
});

test('web manifest names the site and lists any + maskable icons', async () => {
  const manifest = JSON.parse(await read('public/site.webmanifest'));
  assert.equal(manifest.name, 'Diego Alejandro Flores Quintero');
  assert.equal(manifest.short_name, 'diegnghtmr');
  assert.equal(manifest.background_color, '#06080F');
  const purposes = manifest.icons.map((icon) => `${icon.src} ${icon.sizes} ${icon.purpose ?? 'any'}`);
  assert.deepEqual(purposes, ['/icon-192.png 192x192 any', '/icon-512.png 512x512 any', '/icon-maskable-512.png 512x512 maskable']);
});

test('the generator is deterministic', async () => {
  const files = ['public/favicon.ico', 'public/apple-touch-icon.png', 'public/icon-192.png', 'public/icon-512.png', 'public/icon-maskable-512.png'];
  const before = await Promise.all(files.map(read));
  const run = spawnSync(process.execPath, ['scripts/favicon.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const after = await Promise.all(files.map(read));
  files.forEach((file, i) => assert.ok(before[i].equals(after[i]), file));
});
