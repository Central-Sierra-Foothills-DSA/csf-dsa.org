// Make a red-tinted ("duotone") copy of a photo for the flyer headers:
// grayscale, then multiplied into DSA Red. Pre-rendering it keeps the flyer PDFs
// small; doing the same thing with CSS filters makes Chrome embed huge images.
//
// Usage: node scripts/make-red-photo.mjs <input.jpg> <output.jpg>
// Run once per photo and commit the output.
import sharp from 'sharp';

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node scripts/make-red-photo.mjs <input.jpg> <output.jpg>');
  process.exit(1);
}
const red = [0xec, 0x1f, 0x27];
const strength = 0.55; // how much of the photo shows through the red

const { data, info } = await sharp(input)
  .resize({ width: 1400, withoutEnlargement: true })
  .grayscale()
  .linear(1.15, -15) // a little more contrast
  .raw()
  .toBuffer({ resolveWithObject: true });

const out = Buffer.alloc(info.width * info.height * 3);
for (let i = 0; i < info.width * info.height; i++) {
  const g = data[i * info.channels] / 255;
  const k = 1 - strength + strength * g;
  for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(red[c] * k);
}
await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } })
  .jpeg({ quality: 72, mozjpeg: true })
  .toFile(output);
console.log(`Wrote ${output} (${info.width} × ${info.height})`);
