import { useState } from 'react'
import { GROUPS, PRIMARY, exerciseHistory, newId, setsSummary } from '../program'
import { update } from '../store'
import ExerciseHistory from './ExerciseHistory'

export default function Exercises({ state }) {
  const [open, setOpen] = useState(null)
  const toggle = (id) => setOpen(open === id ? null : id)
  // Exercise whose history screen is shown; leaving the tab resets it
  const [detail, setDetail] = useState(null)
  const show = (id) => {
    setDetail(id)
    window.scrollTo(0, 0)
  }

  if (detail) {
    const ex = PRIMARY.find((p) => p.id === detail)
    return <ExerciseHistory name={ex.name} onBack={() => show(null)} />
  }

  return (
    <div className="screen">
      <h1>Exercises</h1>

      <h2 className="section">Primary · 1RM based</h2>
      <div className="card list">
        {PRIMARY.map((p) => (
          <div key={p.id}>
            <button className="list-row" onClick={() => show(p.id)}>
              <span>{p.name}</span>
              <span className="chevron" aria-hidden="true">›</span>
            </button>
          </div>
        ))}
      </div>

      <h2 className="section">Secondary · groups A, B, C</h2>
      <AddSecondary />
      {GROUPS.map((g) => {
        const items = state.secondary.filter((e) => e.group === g)
        return (
          <div className="card list" key={g}>
            <div className="list-title">Group {g} · session {GROUPS.indexOf(g) + 1}</div>
            {items.length === 0 && <p className="muted small">No exercises yet</p>}
            {items.map((ex) => (
              <div key={ex.id}>
                <button className="list-row" onClick={() => toggle(ex.id)} aria-expanded={open === ex.id}>
                  <span>{ex.name}</span>
                  <span className="muted">›</span>
                </button>
                {open === ex.id && (
                  <>
                    <EditSecondary ex={ex} />
                    <History state={state} exId={ex.id} />
                  </>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function History({ state, exId }) {
  const entries = exerciseHistory(state, exId).reverse()
  if (!entries.length) return <p className="muted small history">No sets logged yet</p>
  return (
    <ul className="history">
      {entries.map((h) => (
        <li key={`${h.cycle}-${h.order}`}>
          <span className="muted small">
            {state.cycles.length > 1 && `C${h.cycle + 1} `}W{h.week} S{h.session}
          </span>
          <span className="small">{setsSummary(h.sets)}</span>
          {h.note && <span className="muted small note-line">{h.note}</span>}
        </li>
      ))}
    </ul>
  )
}

function AddSecondary() {
  const [name, setName] = useState('')
  const [group, setGroup] = useState('A')
  function add(e) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    update((d) => d.secondary.push({ id: newId(), name: n, group }))
    setName('')
  }
  return (
    <form className="add-row" onSubmit={add}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pull-up" aria-label="Exercise name" />
      <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Group">
        {GROUPS.map((g) => (
          <option key={g}>{g}</option>
        ))}
      </select>
      <button className="primary" type="submit">Add</button>
    </form>
  )
}

function EditSecondary({ ex }) {
  const edit = (patch) =>
    update((d) => {
      Object.assign(d.secondary.find((e) => e.id === ex.id), patch)
    })
  function remove() {
    if (!confirm(`Remove ${ex.name}? Its logged sets stay in your backup but won't be shown.`)) return
    update((d) => {
      d.secondary = d.secondary.filter((e) => e.id !== ex.id)
    })
  }
  return (
    <div className="add-row">
      <input value={ex.name} onChange={(e) => edit({ name: e.target.value })} aria-label="Rename exercise" />
      <select value={ex.group} onChange={(e) => edit({ group: e.target.value })} aria-label="Move to group">
        {GROUPS.map((g) => (
          <option key={g}>{g}</option>
        ))}
      </select>
      <button className="danger" onClick={remove}>Remove</button>
    </div>
  )
}
