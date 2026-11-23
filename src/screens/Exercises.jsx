import { useState } from 'react'
import { newId } from '../program'
import { update } from '../store'
import ExerciseHistory from './ExerciseHistory'

/**
 * The exercise catalog, a sub-screen of Settings (with a field to add exercises). Main lifts and
 * accessory work are picked from it; tapping an exercise opens its history. History's "All
 * exercises" screen is the same list without the field.
 */
export default function Exercises({ state, onBack, title = 'Exercise catalog', backLabel = 'Back to settings', canAdd = true }) {
  // Exercise whose history screen is shown; leaving the tab resets it
  const [detail, setDetail] = useState(null)
  const show = (id) => {
    setDetail(id)
    window.scrollTo(0, 0)
  }

  const ex = state.catalog.find((e) => e.id === detail)
  if (ex) return <ExerciseHistory state={state} ex={ex} onBack={() => show(null)} />

  return (
    <div className="screen">
      <header className="session-head">
        <button className="icon" data-back aria-label={backLabel} onClick={onBack}>
          ‹
        </button>
        <h1>{title}</h1>
        <span className="icon-spacer" />
      </header>
      {canAdd && <AddExercise />}
      <div className="card list">
        {state.catalog.map((e) => (
          <div key={e.id}>
            <button className="list-row" onClick={() => show(e.id)}>
              <span>{e.name}</span>
              <span className="chevron" aria-hidden="true">›</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AddExercise() {
  const [name, setName] = useState('')
  function add(e) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    update((d) => void d.catalog.push({ id: newId(), name: n }))
    setName('')
  }
  return (
    <form className="add-row" onSubmit={add}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New exercise" aria-label="Exercise name" />
      <button className="primary" type="submit">Add</button>
    </form>
  )
}
