import { useState } from 'react'
import MainLiftFields from './MainLiftFields'
import Sheet from './Sheet'
import { activeSession, finishSession, heaviestWeight, isoDay, mainLiftsError, sessionName, todayIso } from '../program'
import { currentCycle, newCycle, update } from '../store'

/**
 * Start a new 9-week cycle before the current one is complete (e.g. after a break). The current
 * cycle stays in the history; catalog, groups and preferences are untouched. Pre-filled with the
 * current main lifts and 1RMs. An open session is finished as it is first.
 */
export default function NewCycleDialog({ state, onClose }) {
  const cycle = currentCycle(state)
  const open = activeSession(cycle)
  const [date, setDate] = useState(todayIso())
  const [lifts, setLifts] = useState(cycle.primaries.map((id) => ({ id: id ?? '', rm: id ? (cycle.oneRM[id] ?? null) : null })))
  const [error, setError] = useState('')

  function start() {
    if (!date) return setError('Pick a start date.')
    const liftError = mainLiftsError(lifts)
    if (liftError) return setError(liftError)
    const oneRM = Object.fromEntries(lifts.filter((l) => l.id).map((l) => [l.id, l.rm]))
    update((d) => {
      const old = currentCycle(d)
      const openNow = activeSession(old)
      if (openNow) finishSession(d, old, openNow, isoDay(new Date()))
      old.timer = null
      d.cycles.push(newCycle(date, oneRM, lifts.map((l) => l.id || null)))
    })
    onClose()
  }

  return (
    <Sheet onClose={onClose} onSubmit={start}>
      <h2>Start a new cycle</h2>
      <p className="small">
        A fresh 9-week cycle from week 1. The current cycle stays in your history; exercises, groups and preferences
        stay as they are.
      </p>
      {open && <p className="warning small">{sessionName(open)} is still open. It's finished as it is and saved.</p>}
      <label className="field">
        <span>Start date</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <div className="field">
        <span>Main lifts and 1RM</span>
        <MainLiftFields
          rows={lifts}
          catalog={state.catalog}
          prefill={(id) => heaviestWeight(state, id)}
          onChange={(rows) => {
            setError('')
            setLifts(rows)
          }}
        />
      </div>
      {error && <p className="error">{error}</p>}
      <div className="button-row end">
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit" className="primary">Start cycle</button>
      </div>
    </Sheet>
  )
}
