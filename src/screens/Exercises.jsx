import { useState } from 'react'
import { newId } from '../program'
import { update } from '../store'
import ExerciseHistory from './ExerciseHistory'

/**
 * The exercise catalog. Groups pick from it in Settings; main lifts are catalog entries too.
 * Shown as the Exercises tab, and as a sub-screen of Settings (with `onBack` and a back arrow).
 */
export default function Exercises({ state, title = 'Exercises', onBack }) {
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
      {onBack ? (
        <header className="session-head">
          <button className="icon" aria-label="Back to settings" onClick={onBack}>
            ‹
          </button>
          <h1>{title}</h1>
          <span className="icon-spacer" />
        </header>
      ) : (
        <h1>{title}</h1>
      )}
      <AddExercise />
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
