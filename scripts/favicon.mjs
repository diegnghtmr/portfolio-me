// Run with `pnpm favicon`. Builds the browser icon set from the pixel-grid sources in
// assets-src/favicon/ (design/favicon/02-bayer-sphere.html). Every raster is an integer
// multiple of its grid, rendered with nearest-neighbour scaling, so cells stay crisp.
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const src = new URL('../assets-src/favicon/', import.meta.url);
const out = new URL('../public/', import.meta.url);
const SURFACE = '#06080F';
const png = (image) => image.png({ compressionLevel: 9, palette: false }).toBuffer();
// Render a grid SVG at its native size, then upscale by an integer factor.
const grid = async (file, scale) => {
  const native = await sharp(await readFile(new URL(file, src))).png().toBuffer();
  const { width } = await sharp(native).metadata();
  return sharp(native).resize(width * scale, width * scale, { kernel: 'nearest' });
};
// Place a scaled icon on a square surface (Apple touch and maskable keep a margin).
const framed = async (file, scale, size) => {
  const icon = await (await grid(file, scale)).png().toBuffer();
  const inset = (size - 32 * scale) / 2;
  return sharp({ create: { width: size, height: size, channels: 4, background: SURFACE } })
    .composite([{ input: icon, left: inset, top: inset }]);
};
// ICO with embedded PNG images (supported by every current browser).
const ico = (images) => {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const entry = 6 + i * 16;
    header[entry] = size; header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8); header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
};

await copyFile(new URL('icon32.svg', src), new URL('favicon.svg', out));
const icon16 = await png(await grid('icon16.svg', 1));
const icon32 = await png(await grid('icon32.svg', 1));
await writeFile(new URL('favicon.ico', out), ico([{ size: 16, data: icon16 }, { size: 32, data: icon32 }]));
await writeFile(new URL('apple-touch-icon.png', out), await png(await framed('icon32.svg', 5, 180)));
await writeFile(new URL('icon-192.png', out), await png(await grid('icon32.svg', 6)));
await writeFile(new URL('icon-512.png', out), await png(await grid('icon32.svg', 16)));
// Maskable: 12x = 384 px inside 512, within the 80% (409.6 px) safe zone.
await writeFile(new URL('icon-maskable-512.png', out), await png(await framed('icon32.svg', 12, 512)));
console.log('favicon: favicon.svg, favicon.ico (16+32), apple-touch-icon 180, icon 192/512, maskable 512');
