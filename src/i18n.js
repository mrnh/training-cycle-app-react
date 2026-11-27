/*
 * Texts of the app. Every text shown to the user lives in a language file (src/locales/<code>.js,
 * a nested object) and is looked up by key: t('settings.cycle.abort').
 *
 * - Variables: "Session {name} is open" with t('key', { name }).
 * - Plurals: a text can be an object of plural forms, chosen by vars.count with the language's own
 *   rules (Intl.PluralRules): { one: '{count} set', other: '{count} sets' }.
 * - A key missing in the current language falls back to English; one missing there too shows the
 *   key itself (and a warning in the console), so a gap is easy to spot.
 *
 * To add a language: add src/locales/<code>.js with the same keys, register it (and its own
 * name) below.
 */
import de from './locales/de'
import en from './locales/en'

const LANGUAGES = { en, de }
/** Languages the user can pick, with their own names (never translated). */
export const LANGUAGE_NAMES = { en: 'English', de: 'Deutsch' }
const FALLBACK = 'en'
let language = FALLBACK

/** The device's first language that the app has texts for, else English. */
const fromDevice = () => {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const code = tag?.slice(0, 2).toLowerCase()
    if (code in LANGUAGES) return code
  }
  return FALLBACK
}

/** Current language code. */
export const getLanguage = () => language
/**
 * Switch the language of every text looked up from now on. A code the app has no texts for
 * (or none) means "follow the device".
 */
export function setLanguage(code) {
  language = code in LANGUAGES ? code : fromDevice()
  document.documentElement.lang = language
}

const find = (dict, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict)

export function t(key, vars) {
  let text = find(LANGUAGES[language], key) ?? find(LANGUAGES[FALLBACK], key)
  if (text == null) {
    console.warn(`Missing text: ${key}`)
    return key
  }
  if (typeof text === 'object') {
    // Plural forms, picked by count
    const form = new Intl.PluralRules(language).select(vars?.count ?? 0)
    text = text[form] ?? text.other ?? ''
  }
  return vars ? text.replace(/\{(\w+)\}/g, (whole, name) => (vars[name] ?? whole)) : text
}
