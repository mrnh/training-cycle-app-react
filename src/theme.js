// Light or dark look: Auto follows the device, or it is set by hand. The choice is kept on this
// device only (localStorage, like the History sort order), so a backup doesn't carry it to another
// device. The page always carries the resolved theme as <html data-theme="light|dark">; the dark
// colours are under `:root[data-theme='dark']` in index.css. index.html applies it before the
// first paint (same logic as `resolve` below), so there is no flash of the wrong theme.
export const THEMES = [
  { id: 'auto', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]
const KEY = 'theme'
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

function apply(theme) {
  const resolved = resolve(theme)
  document.documentElement.dataset.theme = resolved
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[resolved])
}

/** Apply the saved theme and follow the device while it is Auto. Call once at startup. */
export function startTheme() {
  apply(getTheme())
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => apply(getTheme()))
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
