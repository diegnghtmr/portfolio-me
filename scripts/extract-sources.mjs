import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const artboard = await readFile(new URL('../design/portfolio-home/03-portrait-editorial.html', import.meta.url), 'utf8');
const destination = new URL('../assets-src/', import.meta.url);
const sources = [
  { name: 'AVATAR', format: 'jpeg', file: 'portrait.jpg' },
  { name: 'BLUE_NOISE', format: 'png', file: 'blue-noise-64.png', size: 64 },
];

// Read the data URLs as text; do not run the artboard's JavaScript.
const extracted = await Promise.all(sources.map(async ({ name, format, file, size }) => {
  const match = artboard.match(new RegExp(`\\bconst\\s+${name}\\s*=\\s*"data:image/${format};base64,([A-Za-z0-9+/=]+)"`));
  if (!match) throw new Error(`Missing ${name} data URL in the portrait artboard`);
  const bytes = Buffer.from(match[1], 'base64');
  const { format: decoded, width, height } = await sharp(bytes).metadata();
  if (decoded !== format || (size && (width !== size || height !== size))) {
    throw new Error(`Unexpected format or dimensions for ${name}`);
  }
  return { file, bytes };
}));

await mkdir(destination, { recursive: true });
for (const { file, bytes } of extracted) await writeFile(new URL(file, destination), bytes);
