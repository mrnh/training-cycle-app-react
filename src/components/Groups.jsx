import { useState } from 'react'
import { GROUPS } from '../program'
import { update } from '../store'

/** Settings: which catalog exercises each group (A/B/C) adds to its sessions. */
export default function Groups({ state }) {
  return (
    <section className="card">
      <h2>Secondary groups</h2>
      <p className="muted small">Each session adds one group. Pick exercises from your catalog (Exercises tab).</p>
      {GROUPS.map((g, i) => (
        <Group key={g} state={state} group={g} session={i + 1} />
      ))}
    </section>
  )
}

function Group({ state, group, session }) {
  const ids = state.groups[group]
  const available = state.catalog.filter((e) => !ids.includes(e.id))
  const [pick, setPick] = useState('')

  function add(e) {
    e.preventDefault()
    if (!pick) return
    update((d) => void d.groups[group].push(pick))
    setPick('')
  }
  const remove = (id) => update((d) => void (d.groups[group] = d.groups[group].filter((x) => x !== id)))

  return (
    <div className="group">
      <h3>Group {group} · session {session}</h3>
      {ids.length === 0 && <p className="muted small">No exercises yet</p>}
      <ul className="group-list">
        {ids.map((id) => (
          <li key={id} className="row">
            <span>{state.catalog.find((e) => e.id === id)?.name}</span>
            <button className="icon-btn" aria-label={`Remove from group ${group}`} onClick={() => remove(id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <form className="add-row" onSubmit={add}>
        <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label={`Exercise to add to group ${group}`}>
          <option value="">{available.length ? 'Choose an exercise…' : 'All exercises added'}</option>
          {available.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <button type="submit" disabled={!pick}>Add</button>
      </form>
    </div>
  )
}
