// Symbols for the custom app icon (Settings → Appearance & behavior). Each is one SVG path in a 512 x 512
// box, drawn centred with a margin so it fits the home-screen icon's safe zone. The same path is used
// to draw the icon (canvas Path2D, see theme.js) and for the small previews in the picker.
// `evenodd` marks the symbols that have holes (rings); the others are filled plain.
const rr = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
  `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
const circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`

// The original icon's barbell, enlarged 1.6 times around the centre
const big = ([x, y, w, h, r]) => rr(256 + (x - 256) * 1.6, 256 + (y - 256) * 1.6, w * 1.6, h * 1.6, r * 1.6)
const barbell = [
  [130, 247, 252, 18, 6],
  [160, 194, 28, 124, 8],
  [324, 194, 28, 124, 8],
  [138, 214, 18, 84, 6],
  [356, 214, 18, 84, 6],
].map(big).join('')

const star = Array.from({ length: 10 }, (_, i) => {
  const a = ((-90 + 36 * i) * Math.PI) / 180
  const r = i % 2 ? 66 : 160
  return `${i ? 'L' : 'M'}${(256 + r * Math.cos(a)).toFixed(1)} ${(272 + r * Math.sin(a)).toFixed(1)}`
}).join('') + 'Z'

export const SYMBOLS = [
  { id: 'barbell', label: 'Barbell', d: barbell },
  { id: 'dumbbell', label: 'Dumbbell', d: rr(176, 240, 160, 32, 8) + rr(116, 184, 60, 144, 16) + rr(336, 184, 60, 144, 16) },
  {
    id: 'kettlebell',
    label: 'Kettlebell',
    d: circle(256, 322, 104) + 'M172 230L216 230C208 124 304 124 296 230L340 230C366 60 146 60 172 230Z',
  },
  {
    id: 'medal',
    label: 'Medal',
    d:
      'M168 76H228L250 232H196ZM344 76H284L262 232H316Z' + circle(256, 336, 100) + circle(256, 336, 70) + circle(256, 336, 36),
    evenodd: true,
  },
  { id: 'bolt', label: 'Lightning bolt', d: 'M296 80L170 290H244L220 432L350 216H274Z' },
  {
    id: 'flame',
    label: 'Flame',
    d:
      'M256 76C292 150 384 190 374 304C366 384 314 436 256 436C198 436 146 384 138 304C132 244 176 212 196 156C212 198 234 208 244 198C262 166 250 120 256 76Z' +
      'M256 404C226 404 204 376 212 344C218 320 244 304 256 270C270 304 298 320 300 350C302 380 284 404 256 404Z',
    evenodd: true,
  },
  {
    id: 'trophy',
    label: 'Trophy',
    d:
      'M158 96H354V210C354 272 312 312 276 320V360H332V420H180V360H236V320C200 312 158 272 158 210Z' +
      'M158 128V160H140V168C140 192 152 208 172 216L164 246C134 238 108 212 108 168V128Z' +
      'M354 128H404V168C404 212 378 238 348 246L340 216C360 208 372 192 372 168V160H354Z',
  },
  {
    id: 'stopwatch',
    label: 'Stopwatch',
    d: circle(256, 292, 148) + circle(256, 292, 118) + rr(256 - 30, 76, 60, 32, 8) + rr(256 - 12, 104, 24, 36, 4) + rr(244, 196, 24, 100, 10),
    evenodd: true,
  },
  {
    id: 'heart',
    label: 'Heart',
    d: 'M256 428C112 326 90 232 124 178C158 126 232 128 256 190C280 128 354 126 388 178C422 232 400 326 256 428Z',
  },
  { id: 'mountain', label: 'Mountain', d: 'M64 384L200 148L262 254L312 180L448 384Z' },
  {
    id: 'target',
    label: 'Target',
    d: [160, 128, 96, 64, 32].map((r) => circle(256, 256, r)).join(''),
    evenodd: true,
  },
  { id: 'star', label: 'Star', d: star },
]

export const DEFAULT_SYMBOL = SYMBOLS[0].id
