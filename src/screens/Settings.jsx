import { useRef, useState } from 'react'
import NumInput from '../components/NumInput'
import Groups from '../components/Groups'
import { exerciseName, fmt, todayIso } from '../program'
import { currentCycle, migrate, replaceState, updateCycle } from '../store'

export default function Settings({ state }) {
  const cycle = currentCycle(state)
  const PRIMARY = cycle.primaries.map((id) => ({ id, name: exerciseName(state, id) }))
  const [draft, setDraft] = useState(null) // 1RM values being edited; null = not editing
  const [rmError, setRmError] = useState('')

  function cancelRM() {
    setDraft(null)
    setRmError('')
  }
  function saveRM() {
    if (PRIMARY.some((p) => !(draft[p.id] > 0))) return setRmError('Enter a 1RM for all three lifts.')
    updateCycle((c) => void (c.oneRM = { ...draft }))
    cancelRM()
  }
  const [message, setMessage] = useState('')
  const fileRef = useRef(null)

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `training-plan-${todayIso()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMessage('Backup downloaded')
  }

  async function importData(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      // Older backups are converted to the current format
      const data = migrate(JSON.parse(await file.text()))
      if (!data) throw new Error('not a backup')
      if (!confirm('Replace all current data with this backup?')) return
      replaceState(data)
      setMessage('Backup restored')
    } catch {
      setMessage("That file isn't a training plan backup.")
    }
  }

  function resetAll() {
    if (!confirm('Delete all data on this device? Export a backup first if you want to keep it.')) return
    replaceState(null)
  }

  return (
    <div className="screen">
      <h1>Settings</h1>

      <section className="card">
        <h2>Current cycle</h2>
        <div className="row inline-field">
          <h3>
            <label htmlFor="start-date">Start date</label>
          </h3>
          <input
            id="start-date"
            type="date"
            value={cycle.startDate}
            onChange={(e) => e.target.value && updateCycle((c) => void (c.startDate = e.target.value))}
          />
        </div>

        <div className="row subhead">
          <h3>1RM</h3>
          {!draft && (
            <button className="icon-btn" aria-label="Edit 1RM" onClick={() => setDraft({ ...cycle.oneRM })}>
              ⚙
            </button>
          )}
        </div>

        {draft ? (
          <>
            <p className="warning small">
              Your 1RMs are fixed for the whole cycle. Saving a change recalculates every weight in it, including
              sessions you've already done.
            </p>
            {PRIMARY.map((p) => (
              <label className="field" key={p.id}>
                <span>{p.name} (kg)</span>
                <NumInput
                  value={draft[p.id]}
                  label={`${p.name} 1RM`}
                  onChange={(v) => setDraft({ ...draft, [p.id]: v })}
                />
              </label>
            ))}
            {rmError && <p className="error">{rmError}</p>}
            <div className="button-row end">
              <button onClick={cancelRM}>Cancel</button>
              <button className="primary" onClick={saveRM}>Save</button>
            </div>
          </>
        ) : (
          <div className="list">
            {PRIMARY.map((p) => (
              <div className="row list-row static" key={p.id}>
                <span>{p.name}</span>
                <span>{fmt(cycle.oneRM[p.id])} kg</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <Groups state={state} />

      <section className="card">
        <h2>Backup</h2>
        <p className="muted small">Your data lives only on this device. Export a backup now and then.</p>
        <div className="button-row">
          <button onClick={exportData}>Export backup</button>
          <button onClick={() => fileRef.current.click()}>Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importData} />
        </div>
        {message && <p className="small">{message}</p>}
      </section>

      <section className="card">
        <h2>Reset</h2>
        <button className="danger" onClick={resetAll}>Delete all data</button>
      </section>

      <p className="muted small center">Version {__APP_VERSION__}</p>
    </div>
  )
}
