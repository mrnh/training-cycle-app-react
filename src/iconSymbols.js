// Symbols for the custom app icon (Settings → Appearance & behavior). Each is one SVG path in a 512 x 512
// box, drawn centred with a margin so it fits the home-screen icon's safe zone. The same path is used
// to draw the icon (canvas Path2D, see theme.js) and for the small previews in the picker.
// `evenodd` marks the symbols that have holes (rings); the others are filled plain.
const rr = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
  `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
const circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`

// A straight bar from (x1, y1) to (x2, y2), w wide. All shapes here wind the same way, so overlaps stay filled.
const seg = (x1, y1, x2, y2, w) => {
  const l = Math.hypot(x2 - x1, y2 - y1)
  const nx = (-(y2 - y1) / l) * (w / 2)
  const ny = ((x2 - x1) / l) * (w / 2)
  const p = (x, y) => `${(x).toFixed(1)} ${(y).toFixed(1)}`
  return `M${p(x1 + nx, y1 + ny)}L${p(x2 + nx, y2 + ny)}L${p(x2 - nx, y2 - ny)}L${p(x1 - nx, y1 - ny)}Z`
}

// A lifter squatting with the barbell across the shoulders, seen from the front
const lifter =
  seg(62, 164, 450, 164, 14) + // bar
  seg(94, 116, 94, 212, 26) + seg(124, 132, 124, 196, 16) + // plates, left
  seg(418, 116, 418, 212, 26) + seg(388, 132, 388, 196, 16) + // plates, right
  circle(256, 106, 28) + // head
  'M214 176L230 318L282 318L298 176Z' + // torso
  seg(216, 186, 176, 238, 22) + seg(176, 238, 160, 170, 20) + // left arm up to the bar
  seg(296, 186, 336, 238, 22) + seg(336, 238, 352, 170, 20) + // right arm
  seg(240, 314, 176, 358, 38) + seg(272, 314, 336, 358, 38) + // thighs, knees wide
  seg(176, 358, 200, 428, 34) + seg(336, 358, 312, 428, 34) + // shins
  circle(176, 358, 19) + circle(336, 358, 19) + // knees
  circle(176, 238, 11) + circle(336, 238, 11) + circle(160, 170, 10) + circle(352, 170, 10) + // elbows, hands
  circle(200, 430, 19) + circle(312, 430, 19) // feet

// The original icon's barbell, enlarged 1.6 times around the centre
const big = ([x, y, w, h, r]) => rr(256 + (x - 256) * 1.6, 256 + (y - 256) * 1.6, w * 1.6, h * 1.6, r * 1.6)
const barbell = [
  [130, 247, 252, 18, 6],
  [160, 194, 28, 124, 8],
  [324, 194, 28, 124, 8],
  [138, 214, 18, 84, 6],
  [356, 214, 18, 84, 6],
].map(big).join('')

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
  { id: 'lifter', label: 'Squat', d: lifter },
  { id: 'mountain', label: 'Mountain', d: 'M64 384L200 148L262 254L312 180L448 384Z' },
  {
    id: 'target',
    label: 'Target',
    d: [160, 128, 96, 64, 32].map((r) => circle(256, 256, r)).join(''),
    evenodd: true,
  },
  {
    id: 'arm',
    label: 'Flexed arm',
    d:
      circle(148, 128, 64) + // fist
      seg(150, 170, 160, 330, 80) + // forearm
      circle(160, 366, 56) + // elbow
      seg(160, 366, 420, 366, 112) + // upper arm
      circle(324, 258, 102) + // biceps
      circle(412, 356, 66), // shoulder
  },
]

export const DEFAULT_SYMBOL = SYMBOLS[0].id
