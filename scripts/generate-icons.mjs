import sharp from "sharp";

const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#f59e0b"/>
  <rect x="${size*0.2}" y="${size*0.28}" width="${size*0.6}" height="${size*0.08}" rx="${size*0.04}" fill="white"/>
  <rect x="${size*0.2}" y="${size*0.44}" width="${size*0.45}" height="${size*0.08}" rx="${size*0.04}" fill="white"/>
  <rect x="${size*0.2}" y="${size*0.60}" width="${size*0.55}" height="${size*0.08}" rx="${size*0.04}" fill="white"/>
  <rect x="${size*0.2}" y="${size*0.76}" width="${size*0.35}" height="${size*0.08}" rx="${size*0.04}" fill="white"/>
</svg>`;

for (const size of [192, 512]) {
  await sharp(Buffer.from(svg(size))).png().toFile(`public/icons/icon-${size}.png`);
  console.log(`Generated icon-${size}.png`);
}
await sharp(Buffer.from(svg(180))).png().toFile("public/apple-touch-icon.png");
console.log("Generated apple-touch-icon.png");
