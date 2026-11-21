import { useState } from 'react'
import MainLiftFields from '../components/MainLiftFields'
import { DEFAULT_CATALOG, DEFAULT_PRIMARIES, todayIso } from '../program'
import { initialState, replaceState } from '../store'

export default function Setup() {
  const [startDate, setStartDate] = useState(todayIso())
  const [lifts, setLifts] = useState(DEFAULT_PRIMARIES.map((id) => ({ id, rm: null }))) // per main-lift slot
  const [error, setError] = useState('')

  function start(e) {
    e.preventDefault()
    if (!startDate) return setError('Pick a start date.')
    if (lifts.some((l) => !(l.rm > 0))) return setError('Enter a 1RM for all three lifts.')
    const oneRM = Object.fromEntries(lifts.map((l) => [l.id, l.rm]))
    replaceState(initialState(startDate, oneRM, lifts.map((l) => l.id)))
  }

  return (
    <form className="screen setup" onSubmit={start}>
      <h1>New training cycle</h1>
      <p className="muted">9 weeks, 3 sessions a week. Your 1RMs stay fixed for the whole cycle and are re-tested in week 9.</p>

      <label className="field">
        <span>Start date</span>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </label>

      <div className="field">
        <span>Main lifts and 1RM</span>
        <MainLiftFields
          rows={lifts}
          catalog={DEFAULT_CATALOG}
          onChange={(rows) => {
            setError('')
            setLifts(rows)
          }}
        />
      </div>

      {error && <p className="error">{error}</p>}
      <button className="primary" type="submit">
        Start cycle
      </button>
    </form>
  )
}
