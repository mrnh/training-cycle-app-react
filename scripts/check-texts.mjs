/**
 * Compares the language files in src/locales with American English (en-US.js, the reference): every
 * key must exist in every language (English variants like en-GB may leave keys out), with the same
 * {variables}, and plural forms where English has them.
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

const en = flatten(await load('en-US.js'))
let problems = 0
for (const file of readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'en-US.js')) {
  const other = flatten(await load(file))
  // en-GB and other English variants only hold what differs from en-US
  const partial = file.startsWith('en-')
  const report = (message) => {
    console.log(`${file}: ${message}`)
    problems++
  }
  for (const key of Object.keys(en)) {
    if (!(key in other)) {
      if (!partial) report(`missing ${key}`)
    }
    else if (typeof en[key] !== typeof other[key]) report(`${key} should ${typeof en[key] === 'string' ? 'be plain text' : 'have plural forms'}`)
    else if (typeof en[key] === 'string' && vars(en[key]) !== vars(other[key])) report(`${key} has other {variables} than American English`)
  }
  for (const key of Object.keys(other)) if (!(key in en)) report(`${key} is not in en-US`)
}
console.log(problems ? `${problems} problem(s)` : 'All languages match en-US.')
process.exit(problems ? 1 : 0)
