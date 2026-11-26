import { DEFAULT_SYMBOL, SYMBOLS } from './iconSymbols'

// Light or dark look and accent colour. Auto follows the device, or it is set by hand. The choice is kept on this
// device only (localStorage, like the History sort order), so a backup doesn't carry them to
// another device. The page always carries the resolved theme as <html data-theme="light|dark">; the dark
// colours are under `:root[data-theme='dark']` in index.css. index.html applies it before the
// first paint (same logic as `resolve` below), so there is no flash of the wrong theme.
export const THEMES = [
  { id: 'auto', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]
const KEY = 'theme'
const ACCENT_KEY = 'accent' // a preset id, or 'custom'
const CUSTOM_KEY = 'accent-custom' // the picked colour as #rrggbb
const COLORS = { light: '#f4f4f8', dark: '#121217' } // browser bar colour = page background
const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches

export function getTheme() {
  try {
    const t = localStorage.getItem(KEY)
    return THEMES.some((x) => x.id === t) ? t : 'auto'
  } catch {
    return 'auto'
  }
}

const resolve = (theme) => (theme === 'dark' || (theme === 'auto' && systemDark()) ? 'dark' : 'light')

// Accent colours; the colours themselves are in index.css. The first is the default. The sixth
// choice, 'custom', is any colour the user picks.
export const ACCENTS = [
  { id: 'purple', label: 'Purple' },
  { id: 'blue', label: 'Blue' },
  { id: 'teal', label: 'Teal' },
  { id: 'pink', label: 'Pink' },
  { id: 'graphite', label: 'Graphite' },
]

const HEX = /^#[0-9a-f]{6}$/i

/** The colour picked for the custom accent as #rrggbb, or null if none was picked yet. */
export function getCustomAccent() {
  try {
    const c = localStorage.getItem(CUSTOM_KEY)
    return HEX.test(c) ? c.toLowerCase() : null
  } catch {
    return null
  }
}

/** A preset id, or 'custom' (only once a colour was picked). */
export function getAccent() {
  try {
    const a = localStorage.getItem(ACCENT_KEY)
    if (a === 'custom') return getCustomAccent() ? 'custom' : ACCENTS[0].id
    return ACCENTS.some((x) => x.id === a) ? a : ACCENTS[0].id
  } catch {
    return ACCENTS[0].id
  }
}

// App icon: the home-screen icon is fixed when the app is installed, so the choice only changes what
// the browser offers for the next install (apple-touch-icon for iOS, a second manifest for Android).
// 'custom' is the barbell in a colour the user picks, drawn here as a PNG and handed to iOS as a data
// URL; Android installs keep the light icon, since its icons come from the manifest file.
export const ICONS = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'custom', label: 'Custom' },
]
const ICON_KEY = 'app-icon'
const ICON_COLOR_KEY = 'app-icon-color' // background of the custom icon as #rrggbb
export const DEFAULT_ICON_COLOR = '#6e56cf'
const ICON_SYMBOL_KEY = 'app-icon-symbol'
const symbolById = (id) => SYMBOLS.find((x) => x.id === id) ?? SYMBOLS[0]

export function getIconSymbol() {
  try {
    return symbolById(localStorage.getItem(ICON_SYMBOL_KEY)).id
  } catch {
    return DEFAULT_SYMBOL
  }
}

/** Symbol of the custom icon (picking one also selects the custom icon). */
export function setIconSymbol(id) {
  try {
    localStorage.setItem(ICON_SYMBOL_KEY, id)
    localStorage.setItem(ICON_KEY, 'custom')
  } catch {
    // Storage blocked: the symbol applies until the app is closed
  }
  applyIcon()
}

export function getAppIcon() {
  try {
    const i = localStorage.getItem(ICON_KEY)
    return ICONS.some((x) => x.id === i) ? i : 'light'
  } catch {
    return 'light'
  }
}

export function getIconColor() {
  try {
    const c = localStorage.getItem(ICON_COLOR_KEY)
    return HEX.test(c) ? c.toLowerCase() : DEFAULT_ICON_COLOR
  } catch {
    return DEFAULT_ICON_COLOR
  }
}

/** The custom icon as a PNG data URL (null where canvas is unavailable): the symbol on a full-bleed colour. */
export function customIconUrl(color, symbol, size) {
  const g = document.createElement('canvas').getContext?.('2d')
  if (!g) return null
  g.canvas.width = g.canvas.height = size
  g.fillStyle = color
  g.fillRect(0, 0, size, size)
  // Black or white symbol, whichever reads better on the colour
  const [r, gr, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16))
  g.fillStyle = 0.299 * r + 0.587 * gr + 0.114 * b > 150 ? '#000' : '#fff'
  g.scale(size / 512, size / 512)
  const sym = symbolById(symbol)
  g.fill(new Path2D(sym.d), sym.evenodd ? 'evenodd' : 'nonzero')
  return g.canvas.toDataURL('image/png')
}

function applyIcon() {
  const icon = getAppIcon()
  const suffix = icon === 'dark' ? '-dark' : ''
  // The page's own hrefs are remembered, since a custom icon replaces them with a data URL
  const set = (rel, file, custom, type) => {
    const el = document.querySelector(`link[rel="${rel}"]`)
    if (!el) return
    el.dataset.base ??= el.getAttribute('href')
    const href = custom ?? el.dataset.base.replace(/[^/]*$/, file)
    el.setAttribute('href', href)
    if (type) el.setAttribute('type', custom ? 'image/png' : type)
  }
  const png = icon === 'custom' ? customIconUrl(getIconColor(), getIconSymbol(), 180) : null
  set('apple-touch-icon', `apple-touch-icon${suffix}.png`, png)
  set('manifest', `manifest${suffix}.webmanifest`)
  set('icon', `favicon${suffix}.svg`, png, 'image/svg+xml')
}

export function setAppIcon(icon) {
  try {
    if (icon === 'light') localStorage.removeItem(ICON_KEY)
    else localStorage.setItem(ICON_KEY, icon)
  } catch {
    // Storage blocked: the icon applies until the app is closed
  }
  applyIcon()
}

/** Background colour of the custom icon (picking one also selects the custom icon). */
export function setIconColor(hex) {
  try {
    localStorage.setItem(ICON_COLOR_KEY, hex.toLowerCase())
    localStorage.setItem(ICON_KEY, 'custom')
  } catch {
    // Storage blocked: the colour applies until the app is closed
  }
  applyIcon()
}

function apply(theme) {
  const resolved = resolve(theme)
  document.documentElement.dataset.theme = resolved
  document.documentElement.dataset.accent = getAccent()
  // The picked colour; index.css derives a readable accent from it for each theme
  const custom = getCustomAccent()
  if (custom) document.documentElement.style.setProperty('--custom', custom)
  else document.documentElement.style.removeProperty('--custom')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[resolved])
}

/** Apply the saved theme and follow the device while it is Auto. Call once at startup. */
export function startTheme() {
  apply(getTheme())
  applyIcon()
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => apply(getTheme()))
}

export function setAccent(accent) {
  try {
    if (accent === ACCENTS[0].id) localStorage.removeItem(ACCENT_KEY)
    else localStorage.setItem(ACCENT_KEY, accent)
  } catch {
    // Storage blocked: the accent applies until the app is closed
  }
  apply(getTheme())
}

/** Use a colour picked by the user as the accent (it becomes the selected accent). */
export function setCustomAccent(hex) {
  try {
    localStorage.setItem(CUSTOM_KEY, hex.toLowerCase())
    localStorage.setItem(ACCENT_KEY, 'custom')
  } catch {
    // Storage blocked: the colour applies until the app is closed
  }
  apply(getTheme())
}

export function setTheme(theme) {
  try {
    if (theme === 'auto') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {
    // Storage blocked: the theme applies until the app is closed
  }
  apply(theme)
}
