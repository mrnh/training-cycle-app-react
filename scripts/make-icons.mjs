// Renders the app icon PNGs from public/icon.svg (full-bleed square, mark inside the maskable
// safe zone). Run `npm run icons` after changing the SVG; the PNGs are committed.
import sharp from 'sharp'

const src = new URL('../public/icon.svg', import.meta.url).pathname
const out = (name) => new URL(`../public/${name}`, import.meta.url).pathname
const icons = [
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['maskable-icon-512x512.png', 512], // same artwork: the mark already fits the safe zone
  ['apple-touch-icon.png', 180], // iOS rounds the corners itself
]
for (const [name, size] of icons) {
  await sharp(src, { density: 384 }).resize(size, size).png().toFile(out(name))
  console.log(name)
}
