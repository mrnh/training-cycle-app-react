// Renders the app icon PNGs from public/icon.svg and icon-dark.svg (full-bleed square, mark inside the maskable
// safe zone). Run `npm run icons` after changing the SVG; the PNGs are committed.
import sharp from 'sharp'

const src = (name) => new URL(`../public/${name}`, import.meta.url).pathname
const out = (name) => new URL(`../public/${name}`, import.meta.url).pathname
// The dark variant (white barbell on black, icon-dark.svg) gets the same set with a -dark suffix
const icons = [
  ['pwa-192x192', 192],
  ['pwa-512x512', 512],
  ['maskable-icon-512x512', 512], // same artwork: the mark already fits the safe zone
  ['apple-touch-icon', 180], // iOS rounds the corners itself
]
for (const [svg, suffix] of [['icon.svg', ''], ['icon-dark.svg', '-dark']]) {
  for (const [name, size] of icons) {
    await sharp(src(svg), { density: 384 }).resize(size, size).png().toFile(out(`${name}${suffix}.png`))
    console.log(`${name}${suffix}.png`)
  }
}
