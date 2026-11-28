/*
 * Texts of the app. Every text shown to the user lives in a language file (src/locales/<code>.js,
 * a nested object) and is looked up by key: t('settings.cycle.abort').
 *
 * - Variables: "Session {name} is open" with t('key', { name }).
 * - Plurals: a text can be an object of plural forms, chosen by vars.count with the language's own
 *   rules (Intl.PluralRules): { one: '{count} set', other: '{count} sets' }.
 * - A key missing in the current language falls back to American English (the complete English
 *   file); one missing there too shows the key itself (and a warning in the console), so a gap is easy to spot.
 *
 * To add a language: add src/locales/<code>.js with the same keys, register it (and its own
 * name) below.
 */
import de from './locales/de'
import enGB from './locales/en-GB'
import enUS from './locales/en-US'

// en-GB only holds what differs from en-US and falls back to it for the rest
const LANGUAGES = { 'en-US': enUS, 'en-GB': enGB, de }
/** Languages the user can pick: their own name and a flag (never translated). */
export const LANGUAGE_OPTIONS = [
  { id: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { id: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
]
// Texts missing in a language come from here (en-GB itself only lists what differs from it)
const FALLBACK = 'en-US'
// The default language: used until a choice is read, and when the device's language isn't offered
const DEFAULT = 'en-GB'
let language = DEFAULT

// Countries that write British English, for following the device
const BRITISH = ['en-GB', 'en-AU', 'en-NZ', 'en-IE', 'en-ZA', 'en-IN']

/** The device's first language that the app has texts for, else the default (British English). */
const fromDevice = () => {
  for (const tag of navigator.languages ?? [navigator.language]) {
    if (!tag) continue
    if (tag in LANGUAGES) return tag
    if (BRITISH.includes(tag)) return 'en-GB'
    const base = tag.slice(0, 2).toLowerCase()
    if (base === 'en') return DEFAULT
    if (base in LANGUAGES) return base
  }
  return DEFAULT
}

/** Current language code. */
export const getLanguage = () => language
/**
 * Switch the language of every text looked up from now on. A code the app has no texts for
 * (or none) means "follow the device".
 */
export function setLanguage(code) {
  language = code in LANGUAGES ? code : code === 'en' ? 'en-US' : fromDevice() // 'en' = the old name of en-US
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
