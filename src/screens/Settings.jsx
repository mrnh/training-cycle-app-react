import { useRef, useState } from 'react'
import GroupsSummary, { GroupsEditor } from '../components/Groups'
import MainLiftFields from '../components/MainLiftFields'
import NewCycleDialog from '../components/NewCycleDialog'
import useConfirm from '../components/useConfirm'
import Exercises from './Exercises'
import { DATE_FORMATS, ROUNDINGS, ROUNDING_MODES, UNITS, dateFormat, rounding, roundingMode, exerciseName, fmt, heaviestWeight, mainLiftsError, todayIso, unit } from '../program'
import { currentCycle, migrate, replaceState, update, updateCycle } from '../store'
import { sampleState } from '../sampleData'

// Running as an installed home-screen app (not in a browser tab)
const installed = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true

export default function Settings({ state }) {
  const cycle = currentCycle(state)
  const lifts = cycle.primaries.filter(Boolean) // empty slots left out
  const [draft, setDraft] = useState(null) // [{ id, rm }] per main-lift slot while editing; null = not editing
  const [rmError, setRmError] = useState('')
  const [newCycleOpen, setNewCycleOpen] = useState(false)
  const [subScreen, setSubScreen] = useState(null) // 'groups' | 'exercises' | null

  function cancelRM() {
    setDraft(null)
    setRmError('')
  }
  function saveRM() {
    const error = mainLiftsError(draft)
    if (error) return setRmError(error)
    updateCycle((c) => {
      c.primaries = draft.map((r) => r.id || null)
      c.oneRM = Object.fromEntries(draft.filter((r) => r.id).map((r) => [r.id, r.rm]))
    })
    cancelRM()
  }
  const [message, setMessage] = useState('')
  const fileRef = useRef(null)
  const [confirmDialog, confirm] = useConfirm()

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
      const ok = await confirm({
        title: 'Restore this backup?',
        message: 'All current data on this device is replaced by the backup.',
        confirmLabel: 'Restore',
        danger: true,
      })
      if (!ok) return
      replaceState(data)
      setMessage('Backup restored')
    } catch {
      setMessage("That file isn't a training plan backup.")
    }
  }

  async function loadSample() {
    const ok = await confirm({
      title: 'Use sample data?',
      message: 'All current data on this device is replaced by sample data. Export a backup first if you want to keep yours.',
      confirmLabel: 'Use sample data',
      danger: true,
    })
    if (!ok) return
    replaceState(sampleState({ unit: state.unit, dateFormat: state.dateFormat }))
    setMessage('Sample data loaded')
  }

  async function resetAll() {
    const ok = await confirm({
      title: 'Delete all data?',
      message: 'Everything on this device is deleted: cycles, history, exercises and preferences. Export a backup first if you want to keep it.',
      confirmLabel: 'Delete all data',
      danger: true,
    })
    if (!ok) return
    replaceState(null)
  }

  const show = (screen) => {
    setSubScreen(screen)
    window.scrollTo(0, 0)
  }
  if (subScreen === 'groups') return <GroupsEditor state={state} onBack={() => show(null)} />
  if (subScreen === 'exercises') return <Exercises state={state} onBack={() => show(null)} />

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
          <h3>Main lifts</h3>
          {!draft && (
            <button
              className="sec-pen"
              aria-label="Edit main lifts"
              onClick={() => setDraft(cycle.primaries.map((id) => ({ id: id ?? '', rm: id ? (cycle.oneRM[id] ?? null) : null })))}
            >
              ✎
            </button>
          )}
        </div>

        {draft ? (
          <>
            <p className="warning small">
              Main lifts and 1RMs are fixed for the whole cycle. Saving a change recalculates every weight in sessions
              you haven't finished yet. Finished sessions keep what you did.
            </p>
            <MainLiftFields
              rows={draft}
              catalog={state.catalog}
              prefill={(id) => heaviestWeight(state, id)}
              onChange={(rows) => {
                setRmError('')
                setDraft(rows)
              }}
            />
            <p className="muted small">Picking another exercise fills in the heaviest weight from its history.</p>
            {rmError && <p className="error">{rmError}</p>}
            <div className="button-row end">
              <button onClick={cancelRM}>Cancel</button>
              <button className="primary" onClick={saveRM}>Save</button>
            </div>
          </>
        ) : (
          <div className="list">
            {lifts.map((id) => (
              <div className="row list-row static" key={id}>
                <span>{exerciseName(state, id)}</span>
                <span>{fmt(cycle.oneRM[id])} {unit()}</span>
              </div>
            ))}
          </div>
        )}

        <GroupsSummary state={state} onEdit={() => show('groups')} />

        {!draft && (
          <button className="new-cycle" onClick={() => setNewCycleOpen(true)}>
            Start a new cycle
          </button>
        )}
        {newCycleOpen && <NewCycleDialog state={state} onClose={() => setNewCycleOpen(false)} />}
      </section>

      {/* The whole card opens the catalog; the chevron marks it as leading to another screen */}
      <button className="card nav-card" onClick={() => show('exercises')}>
        <span className="nav-card-text">
          <span className="nav-card-title">Exercise catalog</span>
        </span>
        <Chevron />
      </button>

      <section className="card">
        <h2>Backup</h2>
        <p className="muted small">Your data lives only on this device. Export a backup now and then.</p>
        {/* In the browser (not the installed app): on iPhone the home-screen app has its own,
            empty storage, so the data has to be carried over once */}
        {!installed && (
          <p className="muted small">
            Adding the app to your home screen? On iPhone it starts empty: export a backup here, then import it in the
            installed app.
          </p>
        )}
        <div className="button-row">
          <button onClick={exportData}>Export backup</button>
          <button onClick={() => fileRef.current.click()}>Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importData} />
        </div>
        <button onClick={loadSample}>Use sample data</button>
        {message && <p className="small">{message}</p>}
      </section>

      <section className="card">
        <h2>Preferences</h2>
        <div className="row unit-row">
          <h3>Weight</h3>
          <Segmented
            label="Weight unit"
            options={UNITS.map((u) => ({ id: u, label: u }))}
            value={unit()}
            onChange={(u) => update((d) => void (d.unit = u))}
          />
        </div>
        <p className="muted small">Changes the label only. Numbers are not converted.</p>
        <div className="row unit-row">
          <h3>Date format</h3>
          <Segmented
            label="Date format"
            options={DATE_FORMATS}
            value={dateFormat()}
            onChange={(f) => update((d) => void (d.dateFormat = f))}
          />
        </div>
        <div className="row unit-row">
          <h3>Rounding</h3>
          <Segmented
            label="Rounding direction"
            options={ROUNDING_MODES}
            value={roundingMode()}
            onChange={(m) => update((d) => void (d.roundingMode = m))}
          />
        </div>
        <div className="row unit-row end">
          <Segmented
            label="Rounding of planned weights"
            options={ROUNDINGS.map((r) => ({ id: r, label: `${r === 0.1 ? '.1' : r} ${unit()}` }))}
            value={rounding()}
            onChange={(r) => update((d) => void (d.rounding = r))}
          />
        </div>
        <p className="muted small">Planned main-lift weights are rounded to this step, to the nearest or always up.</p>
        {'wakeLock' in navigator && (
          <>
            <div className="row unit-row">
              <h3>Keep screen on</h3>
              <Segmented
                label="Keep screen on during a session"
                options={[
                  { id: false, label: 'Off' },
                  { id: true, label: 'On' },
                ]}
                value={state.keepAwake !== false}
                onChange={(on) => update((d) => void (d.keepAwake = on))}
              />
            </div>
            <p className="muted small">While a session is in progress and the app is open.</p>
          </>
        )}
      </section>

      <section className="card">
        <h2>Reset</h2>
        <button className="danger" onClick={resetAll}>Delete all data</button>
      </section>

      {confirmDialog}
      <p className="muted small center">Version {__APP_VERSION__}</p>
    </div>
  )
}

/** "›" at the right of a card that opens another screen. */
function Chevron() {
  return (
    <svg className="chevron" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

/** Two or more mutually exclusive options as one row of buttons. */
function Segmented({ label, options, value, onChange }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          className={value === o.id ? 'active' : undefined}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
