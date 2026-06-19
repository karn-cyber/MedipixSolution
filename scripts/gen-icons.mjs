import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const out = join(process.cwd(), "public", "icons");
mkdirSync(out, { recursive: true });

// Medipix mark: rounded teal tile with a white medical "+" and pixel motif.
const svg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <rect x="214" y="120" width="84" height="272" rx="20" fill="#ffffff"/>
  <rect x="120" y="214" width="272" height="84" rx="20" fill="#ffffff"/>
  <rect x="150" y="150" width="36" height="36" rx="8" fill="#ffffff" opacity="0.55"/>
  <rect x="326" y="326" width="36" height="36" rx="8" fill="#ffffff" opacity="0.55"/>
</svg>`;

const sizes = [192, 512];
for (const s of sizes) {
  await sharp(Buffer.from(svg(s))).png().toFile(join(out, `icon-${s}.png`));
  // maskable variant (same art, safe padding already built in)
  await sharp(Buffer.from(svg(s))).png().toFile(join(out, `maskable-${s}.png`));
  console.log(`wrote icon-${s}.png`);
}
