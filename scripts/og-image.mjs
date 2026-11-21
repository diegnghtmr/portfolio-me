// Run with pnpm og. Generic fonts are resolved by the host's SVG renderer.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { en } from '../src/i18n/en.ts';
import { es } from '../src/i18n/es.ts';

const width = 1200;
const height = 630;
const surface = '#06080F';
const ink = '#7FB4CA';
const posterPath = fileURLToPath(new URL('../public/dither/hero-poster-dark.png', import.meta.url));
const output = new URL('../public/og/', import.meta.url);
const escapeXml = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function wrap(text, limit) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && line.length + 1 + word.length > limit) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  return [...lines, line];
}

function overlay({ titleRole, description }) {
  const lines = wrap(description, 39).map((line, index) =>
    `<text x="72" y="${412 + index * 34}" font-size="25">${escapeXml(line)}</text>`).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <g font-family="sans-serif" fill="#F3F6F9" font-size="60" font-weight="700">
      <text x="72" y="224">Diego Alejandro</text>
      <text x="72" y="292">Flores Quintero</text>
    </g>
    <g font-family="sans-serif" fill="${ink}">
      <text x="72" y="360" font-size="33" font-weight="600">${escapeXml(titleRole)}</text>
      ${lines}
    </g>
    <text x="72" y="542" font-family="monospace" font-size="23" fill="#E0C15A">diegnghtmr.me</text>
  </svg>`);
}

const poster = await sharp(posterPath).resize(600, 440, { kernel: sharp.kernel.nearest }).png().toBuffer();
await mkdir(output, { recursive: true });
for (const [locale, messages] of Object.entries({ en, es })) {
  const png = await sharp({ create: { width, height, channels: 3, background: surface } })
    .composite([{ input: poster, left: 600, top: 95 }, { input: overlay(messages) }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(new URL(`home-${locale}.png`, output), png);
}
