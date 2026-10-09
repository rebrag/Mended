// Renders the app icons from assets/*.svg. Run with: node scripts/generate-icons.mjs
import { mkdirSync, readFileSync } from "node:fs";
import sharp from "sharp";

const icon = readFileSync("assets/icon.svg");
const badge = readFileSync("assets/badge.svg");
mkdirSync("public/icons", { recursive: true });

const outputs = [
  [icon, 192, "public/icons/icon-192.png"],
  [icon, 512, "public/icons/icon-512.png"],
  [icon, 180, "src/app/apple-icon.png"],
  [badge, 96, "public/icons/badge-96.png"],
];
for (const [svg, size, file] of outputs) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(file);
  console.log("wrote", file);
}
