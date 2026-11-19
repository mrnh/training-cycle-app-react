import { useState } from 'react'
import NumInput from '../components/NumInput'
import { PRIMARY, todayIso } from '../program'
import { initialState, replaceState } from '../store'

export default function Setup() {
  const [startDate, setStartDate] = useState(todayIso())
  const [oneRM, setOneRM] = useState({ squat: null, bench: null, deadlift: null })
  const [error, setError] = useState('')

  function start(e) {
    e.preventDefault()
    if (!startDate) return setError('Pick a start date.')
    if (PRIMARY.some((p) => !(oneRM[p.id] > 0))) return setError('Enter a 1RM for all three lifts.')
    replaceState(initialState(startDate, oneRM))
  }

  return (
    <form className="screen setup" onSubmit={start}>
      <h1>New training cycle</h1>
      <p className="muted">9 weeks, 3 sessions a week. Your 1RMs stay fixed for the whole cycle and are re-tested in week 9.</p>

      <label className="field">
        <span>Start date</span>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </label>

      {PRIMARY.map((p) => (
        <label className="field" key={p.id}>
          <span>{p.name} 1RM (kg)</span>
          <NumInput
            value={oneRM[p.id]}
            placeholder="100"
            label={`${p.name} 1RM`}
            onChange={(v) => {
              setError('')
              setOneRM({ ...oneRM, [p.id]: v })
            }}
          />
        </label>
      ))}

      {error && <p className="error">{error}</p>}
      <button className="primary" type="submit">
        Start cycle
      </button>
    </form>
  )
}
