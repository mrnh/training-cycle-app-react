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
