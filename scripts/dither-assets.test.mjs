import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const sourceRoot = new URL('../assets-src/', import.meta.url);
const generator = 'scripts/dither-assets.mjs';
const colors = {
  dark: { surface: '#06080F', mid: '#27345C', ink: '#7FB4CA', text: '#F3F6F9' },
  light: { surface: '#F3F6F9', mid: '#91C7DD', ink: '#24596C', text: '#06080F' },
};

async function decode(bytes, width, height) {
  const image = sharp(bytes);
  const metadata = await image.metadata();
  assert.deepEqual([metadata.format, metadata.width, metadata.height], ['png', width, height]);
  return image.removeAlpha().toColourspace('srgb').raw().toBuffer();
}

function assertInks(pixels, inks) {
  const actual = new Set();
  for (let i = 0; i < pixels.length; i += 3) {
    actual.add(`#${pixels.subarray(i, i + 3).toString('hex').toUpperCase()}`);
  }
  assert.ok(actual.size > 1, 'asset must not be a flat fill');
  for (const ink of actual) assert.ok(inks.includes(ink), `unexpected ink ${ink}; expected ${inks.join(', ')}`);
}

function run(cwd) {
  return spawnSync(process.execPath, [generator], { cwd, encoding: 'utf8' });
}

function assertSuccess(result) {
  assert.ifError(result.error);
  assert.deepEqual([result.status, result.stdout, result.stderr], [0, '', '']);
}

test('dither asset generator CLI', async (t) => {
  const work = await mkdtemp(join(tmpdir(), 'portfolio-dither-'));
  t.after(() => rm(work, { recursive: true, force: true }));
  await Promise.all(['assets-src', 'scripts'].map(dir => mkdir(join(work, dir))));
  await Promise.all([
    symlink(fileURLToPath(new URL('../node_modules', import.meta.url)), join(work, 'node_modules'), 'junction'),
    ...['portrait.jpg', 'blue-noise-64.png'].map(file => copyFile(new URL(file, sourceRoot), join(work, 'assets-src', file))),
    copyFile(new URL(`../${generator}`, import.meta.url), join(work, generator)),
  ]);
  assertSuccess(run(work));

  const manifestPath = 'src/data/dither-manifest.json';
  const snapshot = async () => {
    const files = await readdir(join(work, 'public/dither'));
    return Object.fromEntries(await Promise.all([manifestPath, ...files.map(file => `public/dither/${file}`)]
      .map(async path => [path, await readFile(join(work, path))])));
  };
  const before = await snapshot();
  const asset = file => before[`public/dither/${file}`];

  await t.test('PNG dimensions, exact inks, and complete manifest', async () => {
    const entries = JSON.parse(before[manifestPath]);
    const check = async (file, width, height, inks, family, cell) => {
      const bytes = asset(file);
      assert.ok(bytes, `missing ${file}`);
      assert.deepEqual(entries.find(entry => entry.file === `/dither/${file}`),
        { file: `/dither/${file}`, width, height, inks, family, cell, bytes: bytes.length });
      return decode(bytes, width, height);
    };
    assert.equal(entries.length, 17);
    assert.equal(Object.keys(before).length, 18);
    await check('blue-noise-64.png', 64, 64, [], 'blue-noise', 1);
    assert.deepEqual(asset('blue-noise-64.png'), await readFile(new URL('blue-noise-64.png', sourceRoot)));
    for (const [theme, { surface, mid, ink, text }] of Object.entries(colors)) {
      const ramp = [theme === 'dark' ? surface : text, ...[mid, ink].sort(), theme === 'dark' ? text : surface];
      assertInks(await check(`portrait-${theme}-0.png`, 67, 67, ramp, 'atkinson', 2), ramp);
      for (let frame = 1; frame <= 4; frame++) {
        await check(`portrait-${theme}-${frame}.png`, 67, 67, ramp, 'blue-noise', 2);
      }
      await check(`portrait-${theme}-5.png`, 67, 67, [], 'original', 2);
      assertInks(await check(`hero-poster-${theme}.png`, 150, 110, [surface, ink], 'bayer-8x8', 4), [surface, ink]);
      const horizonInks = [surface, mid, ink, '#E0C15A'];
      assertInks(await check(`horizon-${theme}.png`, 360, 55, horizonInks, 'bayer-8x8', 4), horizonInks);
    }
  });

  await t.test('stationary blue-noise reveal resolves to one grayscale original', async () => {
    const noise = await decode(asset('blue-noise-64.png'), 64, 64);
    const original = await decode(asset('portrait-dark-5.png'), 67, 67);
    assert.deepEqual(original, await decode(asset('portrait-light-5.png'), 67, 67));
    for (let i = 0; i < original.length; i += 3) {
      assert.equal(original[i], original[i + 1]);
      assert.equal(original[i], original[i + 2]);
    }
    for (const theme of Object.keys(colors)) {
      const dithered = await decode(asset(`portrait-${theme}-0.png`), 67, 67);
      for (let frame = 1; frame <= 4; frame++) {
        const expected = Buffer.from(dithered);
        for (let y = 0; y < 67; y++) for (let x = 0; x < 67; x++) {
          const threshold = (noise[((y % 64) * 64 + x % 64) * 3] + 0.5) / 256;
          const i = (y * 67 + x) * 3;
          if (threshold < frame / 5) original.copy(expected, i, i, i + 3);
        }
        assert.deepEqual(await decode(asset(`portrait-${theme}-${frame}.png`), 67, 67), expected);
      }
    }
  });

  await t.test('running generation twice yields identical bytes', async () => {
    assertSuccess(run(work));
    assert.deepEqual(await snapshot(), before);
  });

  await t.test('rejects a wrong-size noise tile without replacing previous output', async () => {
    await writeFile(join(work, 'assets-src/blue-noise-64.png'), asset('horizon-dark.png'));
    const result = run(work);
    assert.ifError(result.error);
    assert.deepEqual([result.status, result.stdout, result.stderr],
      [1, '', 'dither-assets: blue-noise-64.png must be a 64x64 PNG\n']);
    assert.deepEqual(await snapshot(), before);
  });
});
