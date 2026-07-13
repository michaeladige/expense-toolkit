// Rasterizes the source icon SVGs into the PNG sizes the manifest/HTML need.
// Run manually with `npm run icons` after editing either source SVG; outputs
// are committed to public/ like any other static asset.
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const publicDir = resolve(root, "public");

const regularSvg = await readFile(resolve(publicDir, "favicon.svg"));
const maskableSvg = await readFile(resolve(here, "icon-source-maskable.svg"));

async function render(svg, size, outFile) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(resolve(publicDir, outFile));
  console.log(`  wrote public/${outFile} (${size}x${size})`);
}

console.log("Generating icons...");
await render(regularSvg, 192, "pwa-192x192.png");
await render(regularSvg, 512, "pwa-512x512.png");
await render(regularSvg, 48, "favicon.png");
// Maskable/apple-touch icons must come from the full-bleed source: iOS
// renders transparent PNG regions as black, and Android's adaptive-icon mask
// clips anything outside the safe zone, so the padded/rounded regular icon
// is the wrong source for either.
await render(maskableSvg, 512, "pwa-maskable-512x512.png");
await render(maskableSvg, 180, "apple-touch-icon.png");

console.log("Done.");
