/*
 * Texts of the app. Every text shown to the user lives in a language file (src/locales/<code>.js,
 * a nested object) and is looked up by key: t('settings.cycle.abort').
 *
 * - Variables: "Session {name} is open" with t('key', { name }).
 * - Plurals: a text can be an object of plural forms, chosen by vars.count with the language's own
 *   rules (Intl.PluralRules): { one: '{count} set', other: '{count} sets' }.
 * - A key missing in the current language falls back to American English; one missing there too
 *   shows the key itself (and a warning in the console), so a gap is easy to spot.
 *
 * The app always starts in American English; the language is only switched by the user's choice
 * (Settings → Preferences), it does not follow the device.
 *
 * To add a language: add src/locales/<code>.js with the same keys, register it (and its own
 * name and flag) below.
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
// American English is the default language, and the one texts missing in another language come from
// (en-US is the complete English file; en-GB only lists what differs from it)
const DEFAULT = 'en-US'
let language = DEFAULT

/** Current language code. */
export const getLanguage = () => language
/**
 * Switch the language of every text looked up from now on. No code, or one the app has no texts
 * for, means the default (American English); the device's language is not followed.
 */
export function setLanguage(code) {
  language = code in LANGUAGES ? code : code === 'en' ? 'en-US' : DEFAULT // 'en' = the old name of en-US
  document.documentElement.lang = language
}

const find = (dict, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict)

export function t(key, vars) {
  let text = find(LANGUAGES[language], key) ?? find(LANGUAGES[DEFAULT], key)
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
