/**
 * The newest CHANGELOG entry as data for the update bar ("What's new"):
 *   { version, title, sections: [{ heading, items: ['text with **bold**', …] }] }
 * Screenshot tables and other lines are left out; wrapped list items are joined.
 */
export function latestRelease(changelog) {
  const entry = changelog.split(/^## /m)[1] // text after the first "## " heading
  if (!entry) return null
  const [headingLine, ...lines] = entry.split('\n')
  // "0.18.1 — 2026-11-23 · Consistency pass"
  const m = headingLine.match(/^(\S+)\s+—\s+\S+\s+·\s+(.+)$/)
  if (!m) return null

  const sections = []
  for (const line of lines) {
    if (line.startsWith('---')) break // end of the entry
    if (line.startsWith('### ')) sections.push({ heading: line.slice(4).trim(), items: [] })
    else if (!sections.length) continue // screenshot table etc. above the first section
    else if (line.startsWith('- ')) sections.at(-1).items.push(line.slice(2).trim())
    else if (/^\s+\S/.test(line) && sections.at(-1).items.length) {
      // continuation of a wrapped list item
      const items = sections.at(-1).items
      items[items.length - 1] += ' ' + line.trim()
    }
  }
  return { version: m[1], title: m[2].trim(), sections }
}
