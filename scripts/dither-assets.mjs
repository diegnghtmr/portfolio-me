// Usage: node scripts/dither-assets.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { applyPaletteSync, utils } from 'image-q';
import sharp from 'sharp';

const sources = new URL('../assets-src/', import.meta.url);
const output = new URL('../public/dither/', import.meta.url);
const manifest = new URL('../src/data/dither-manifest.json', import.meta.url);
const SIZE = 44;
const TILE = 64;
const DARKEST = '#06080F';
const LIGHTEST = '#F3F6F9';
const GOLD = '#E0C15A';
const themes = {
  dark: { surface: DARKEST, mid: '#27345C', ink: '#7FB4CA' },
  light: { surface: LIGHTEST, mid: '#91C7DD', ink: '#24596C' },
};

const rgb = hex => Buffer.from(hex.slice(1), 'hex');
const decodeRGB = image => image.removeAlpha().toColourspace('srgb').raw().toBuffer();
const linear = value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

function ditherPortrait(grayscale, inks) {
  // Diffuse errors in linear luminance, like artboard 03. Each projected
  // palette entry is a code for one exact sRGB brand ink, never a saved gray.
  const palette = new utils.Palette();
  const inkByLuminance = new Map();
  for (const ink of inks) {
    const channels = rgb(ink);
    const [r, g, b] = Array.from(channels, value => linear(value / 255));
    const code = Math.round((0.2126 * r + 0.7152 * g + 0.0722 * b) * 255);
    if (inkByLuminance.has(code)) throw new Error('Portrait inks must have distinct luminance');
    palette.add(utils.Point.createByRGBA(code, code, code, 255));
    inkByLuminance.set(code, channels);
  }
  const source = Buffer.alloc(grayscale.length * 4, 255);
  const pixels = Buffer.alloc(grayscale.length * 3);
  for (let i = 0; i < grayscale.length; i++) {
    source.fill(Math.round(linear(grayscale[i] / 255) * 255), i * 4, i * 4 + 3);
    pixels.fill(grayscale[i], i * 3, i * 3 + 3);
  }
  const image = utils.PointContainer.fromUint8Array(source, SIZE, SIZE);
  const quantized = applyPaletteSync(image, palette, { imageQuantization: 'atkinson' }).toUint8Array();
  const dithered = Buffer.alloc(pixels.length);
  for (let i = 0; i < grayscale.length; i++) inkByLuminance.get(quantized[i * 4]).copy(dithered, i * 3);
  return { original: pixels, dithered };
}

function reveal(original, dithered, noise, frame) {
  if (frame === 0) return dithered;
  if (frame === 5) return original;
  const pixels = Buffer.from(dithered);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    // Artboard 03 centers each 8-bit noise sample in its bucket so p=1 reveals all.
    const threshold = (noise[((y % TILE) * TILE + x % TILE) * 3] + 0.5) / 256;
    if (threshold < frame / 5) {
      const i = (y * SIZE + x) * 3;
      original.copy(pixels, i, i, i + 3);
    }
  }
  return pixels;
}

function bayer8() {
  const quadrants = [[0, 2], [3, 1]];
  let ranks = [[0]];
  for (let span = 1; span < 8; span *= 2) {
    ranks = Array.from({ length: span * 2 }, (_, y) =>
      Array.from({ length: span * 2 }, (_, x) =>
        4 * ranks[y % span][x % span] + quadrants[+(y >= span)][+(x >= span)]));
  }
  return ranks.map(row => row.map(rank => (rank + 0.5) / 64));
}

const BAYER = bayer8();
function render(width, height, inks, inkAt) {
  const colors = inks.map(rgb);
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = inkAt(x, y, BAYER[y % 8][x % 8]);
    colors[index].copy(pixels, (y * width + x) * 3);
  }
  return pixels;
}

function sphereTone(u, v, aspect) {
  // Artboard 01 sphere at its initial light direction, frozen for the poster.
  const radius = 0.38;
  const x = (u - 0.5) * aspect / radius;
  const y = (v - 0.5) / radius;
  const zSquared = 1 - x * x - y * y;
  if (zSquared < 0) return 0;
  return 0.95 * (0.6 * x - 0.55 * y + 0.6 * Math.sqrt(zSquared)) + 0.08;
}

const pk = x => (1 - Math.abs(Math.sin(x))) ** 1.6;
function ridge(u, base, amplitude, frequency, phase) {
  const wave = u * frequency;
  return base - amplitude * (0.62 * pk(wave + phase)
    + 0.28 * pk(wave * 2.13 + phase * 1.9) + 0.1 * Math.sin(wave * 6.7 + phase));
}

function horizonInk(x, y, width, height, threshold) {
  // Artboard 01's Quindío horizon, composited from front (coffee rows) to back (sun).
  const u = x / width;
  const v = y / height;
  const near = ridge(u, 0.84, 0.16, 2.2, 4.1);
  if (v >= near) {
    const coffeeRows = Math.sin(x * 0.35 - y * 1.1) > 0.2;
    const tone = 0.2 + 0.35 * Math.min(1, (v - near) * 5) + (coffeeRows ? 0.3 : 0);
    return tone > threshold ? 2 : 1;
  }
  const middle = ridge(u, 0.68, 0.26, 3.1, 2.4);
  if (v >= middle) return 0.15 + 0.55 * Math.min(1, (v - middle) * 3.5) > threshold ? 2 : 1;
  const far = ridge(u, 0.50, 0.34, 4.2, 0.9);
  if (v >= far) return 0.18 + 0.5 * Math.min(1, (v - far) * 3) > threshold ? 1 : 0;
  const sun = Math.hypot((u - 0.7) * (width / height), v - 0.3);
  if (sun >= 0.30) return 0;
  const glow = sun < 0.13 ? 0.72 : 0.72 * (1 - (sun - 0.13) / 0.17);
  return glow > threshold ? 3 : 0;
}

async function expectPng(image, file, width, height) {
  const metadata = await image.metadata();
  if (metadata.format !== 'png' || metadata.width !== width || metadata.height !== height) {
    throw new Error(`${file} must be a ${width}x${height} PNG`);
  }
}

async function encode(file, width, height, inks, family, cell, pixels, indexed = false) {
  if (!Number.isInteger(cell) || cell < 1) throw new Error(`${file} needs a positive integer cell size`);
  const png = await sharp(pixels, { raw: { width, height, channels: 3 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true,
      ...(indexed && { palette: true, colours: inks.length, dither: 0 }) })
    .toBuffer();
  const image = sharp(png);
  await expectPng(image, file, width, height);
  const decoded = await decodeRGB(image);
  if (indexed) {
    const palette = new Set(inks.map(ink => rgb(ink).readUIntBE(0, 3)));
    for (let i = 0; i < decoded.length; i += 3) {
      if (!palette.has(decoded.readUIntBE(i, 3))) throw new Error(`${file} contains an off-palette pixel`);
    }
  }
  if (!decoded.equals(pixels)) throw new Error(`${file} did not round-trip losslessly`);
  return { file, entry: { file: `/dither/${file}`, width, height, inks, family, cell, bytes: png.length }, png };
}

async function generate() {
  const noiseFile = 'blue-noise-64.png';
  const blueNoise = await readFile(new URL(noiseFile, sources));
  const noiseImage = sharp(blueNoise);
  await expectPng(noiseImage, noiseFile, TILE, TILE);
  const noise = await decodeRGB(noiseImage);
  const grayscale = await sharp(fileURLToPath(new URL('portrait.jpg', sources)))
    .resize(SIZE, SIZE).greyscale().linear(1.12, -12).sharpen({ sigma: 0.6 })
    .toColourspace('b-w').raw().toBuffer();

  const assets = [{
    file: noiseFile,
    entry: { file: `/dither/${noiseFile}`, width: TILE, height: TILE, inks: [], family: 'blue-noise', cell: 1, bytes: blueNoise.length },
    png: blueNoise,
  }];
  for (const [theme, { surface, mid, ink }] of Object.entries(themes)) {
    const ramp = [DARKEST, ...(theme === 'dark' ? [mid, ink] : [ink, mid]), LIGHTEST];
    const { original, dithered } = ditherPortrait(grayscale, ramp);
    for (let frame = 0; frame <= 5; frame++) {
      const family = frame === 0 ? 'atkinson' : frame === 5 ? 'original' : 'blue-noise';
      assets.push(await encode(`portrait-${theme}-${frame}.png`, SIZE, SIZE,
        frame === 5 ? [] : ramp, family, 2, reveal(original, dithered, noise, frame), frame === 0));
    }
    const posterInks = [surface, ink];
    const posterWidth = 150;
    const posterHeight = 110;
    const poster = render(posterWidth, posterHeight, posterInks, (x, y, th) =>
      sphereTone(x / posterWidth, y / posterHeight, posterWidth / posterHeight) > th ? 1 : 0);
    assets.push(await encode(`hero-poster-${theme}.png`, posterWidth, posterHeight, posterInks, 'bayer-8x8', 4, poster, true));

    const horizonInks = [surface, mid, ink, GOLD];
    const horizonWidth = 360;
    const horizonHeight = 55;
    const horizon = render(horizonWidth, horizonHeight, horizonInks, (x, y, th) =>
      horizonInk(x, y, horizonWidth, horizonHeight, th));
    assets.push(await encode(`horizon-${theme}.png`, horizonWidth, horizonHeight, horizonInks, 'bayer-8x8', 4, horizon, true));
  }

  // Validate every asset before replacing any output.
  await mkdir(output, { recursive: true });
  await mkdir(new URL('./', manifest), { recursive: true });
  for (const { file, png } of assets) await writeFile(new URL(file, output), png);
  await writeFile(manifest, `${JSON.stringify(assets.map(({ entry }) => entry), null, 2)}\n`);
}

try {
  await generate();
} catch (error) {
  console.error(`dither-assets: ${error.message}`);
  process.exitCode = 1;
}
