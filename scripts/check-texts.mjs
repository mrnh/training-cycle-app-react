/**
 * Compares the language files in src/locales with English (the reference): every key must exist in
 * every language, with the same {variables}, and plural forms where English has them.
 * Run: npm run check-texts
 */
import { readdirSync } from 'node:fs'

const dir = new URL('../src/locales/', import.meta.url)
const load = async (file) => (await import(new URL(file, dir))).default
const flatten = (o, prefix = '', out = {}) => {
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === 'object' && !('other' in v)) flatten(v, `${prefix}${k}.`, out)
    else out[`${prefix}${k}`] = v
  }
  return out
}
const vars = (v) => [...new Set((typeof v === 'string' ? v : Object.values(v).join(' ')).match(/\{\w+\}/g) ?? [])].sort().join(' ')

const en = flatten(await load('en.js'))
let problems = 0
for (const file of readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'en.js')) {
  const other = flatten(await load(file))
  for (const key of Object.keys(en)) {
    if (!(key in other)) console.log(`${file}: missing ${key}`), problems++
    else if (typeof en[key] !== typeof other[key]) console.log(`${file}: ${key} should ${typeof en[key] === 'string' ? 'be plain text' : 'have plural forms'}`), problems++
    else if (typeof en[key] === 'string' && vars(en[key]) !== vars(other[key])) console.log(`${file}: ${key} has other {variables} than English`), problems++
  }
  for (const key of Object.keys(other)) if (!(key in en)) console.log(`${file}: ${key} is not in English`), problems++
}
console.log(problems ? `${problems} problem(s)` : 'All languages match English.')
process.exit(problems ? 1 : 0)
