import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const generator = 'scripts/og-image.mjs';
const paths = ['public/og/home-en.png', 'public/og/home-es.png'];

async function images(read) {
  const bytes = await Promise.all(paths.map(read));
  for (const png of bytes) {
    const { format, width, height } = await sharp(png).metadata();
    assert.deepEqual([format, width, height], ['png', 1200, 630]);
  }
  assert.notDeepEqual(bytes[0], bytes[1], 'each locale has a distinct card');
  return bytes;
}

test('both published OG cards are 1200 × 630 PNGs', async () => {
  await images((path) => readFile(new URL(path, root)));
});

test('the OG image CLI generates identical bytes on a rerun', async (t) => {
  const work = await mkdtemp(join(tmpdir(), 'portfolio-og-'));
  t.after(() => rm(work, { recursive: true, force: true }));
  for (const dir of ['scripts', 'src/i18n', 'public/dither']) {
    await mkdir(join(work, dir), { recursive: true });
  }
  await symlink(fileURLToPath(new URL('node_modules', root)), join(work, 'node_modules'), 'junction');
  for (const path of [generator, 'src/i18n/en.ts', 'src/i18n/es.ts', 'public/dither/hero-poster-dark.png']) {
    await copyFile(new URL(path, root), join(work, path));
  }

  const run = async () => {
    const result = spawnSync(process.execPath, [generator], { cwd: work, encoding: 'utf8' });
    assert.ifError(result.error);
    assert.deepEqual([result.status, result.stdout, result.stderr], [0, '', '']);
    return images((path) => readFile(join(work, path)));
  };
  assert.deepEqual(await run(), await run());
});
