import { useRef, useState } from 'react'
import GroupsSummary, { GroupsEditor } from '../components/Groups'
import MainLiftFields from '../components/MainLiftFields'
import NewCycleDialog from '../components/NewCycleDialog'
import useConfirm from '../components/useConfirm'
import Chevron from '../components/Chevron'
import Exercises from './Exercises'
import { DATE_FORMATS, ROUNDINGS, ROUNDING_MODES, UNITS, dateFormat, rounding, roundingMode, exerciseName, fmt, cycleEnd, cycleRange, cycleStarted, fmtDate, goalWeight, heaviestWeight, mainLiftsError, programOf, todayIso, unit } from '../program'
import { currentCycle, migrate, replaceState, update, updateCycle } from '../store'
import { sampleState } from '../sampleData'
import ScreenHeader from '../components/ScreenHeader'
import { SYMBOLS } from '../iconSymbols'
import { ACCENTS, ICONS, THEMES, customIconUrl, isIconCustomised, placeholderIconUrl, getAccent, getAppIcon, getIconColor, getIconSymbol, getIconSymbolColor, setIconSymbolColor, symbolColorFor, setAppIcon, setIconColor, setIconSymbol, getCustomAccent, getTheme, setAccent, setCustomAccent, setTheme } from '../theme'

// Running as an installed home-screen app (not in a browser tab)
const installed = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true

export default function Settings({ state }) {
  const cycle = currentCycle(state)
  const lifts = cycle.primaries.filter(Boolean) // empty slots left out
  const program = programOf(cycle)
  const counts = program.weeks.map((w) => w.length)
  const perWeek = Math.min(...counts) === Math.max(...counts) ? `${counts[0]}` : `${Math.min(...counts)}–${Math.max(...counts)}`
  const [draft, setDraft] = useState(null) // [{ id, rm }] per main-lift slot while editing; null = not editing
  const [rmError, setRmError] = useState('')
  const [newCycleOpen, setNewCycleOpen] = useState(false)
  const [theme, setThemeState] = useState(getTheme)
  const changeTheme = (t) => {
    setTheme(t)
    setThemeState(t)
  }
  const [appIcon, setAppIconState] = useState(getAppIcon)
  const changeAppIcon = (i) => {
    setAppIcon(i)
    setAppIconState(i)
  }
  const pickIconSymbol = (id) => {
    setIconSymbol(id)
    setIconSymbolState(id)
    setCustomised(true)
    setAppIconState('custom')
  }
  const pickSymbolColor = (c) => {
    setIconSymbolColor(c)
    setSymbolColorState(c)
    setCustomised(true)
    setAppIconState('custom')
  }
  const pickIconColor = (c) => {
    setIconColor(c)
    setIconColorState(c)
    setCustomised(true)
    setAppIconState('custom')
  }
  const [customised, setCustomised] = useState(isIconCustomised) // anything of the custom icon picked yet
  const [iconColor, setIconColorState] = useState(getIconColor)
  const [iconSymbol, setIconSymbolState] = useState(getIconSymbol)
  const [symbolColor, setSymbolColorState] = useState(getIconSymbolColor) // picked colour, or null = by contrast
  const [accent, setAccentState] = useState(getAccent)
  const [custom, setCustomState] = useState(getCustomAccent) // the picked colour, or null
  const changeAccent = (a) => {
    setAccent(a)
    setAccentState(a)
  }
  const pickCustom = (hex) => {
    setCustomAccent(hex)
    setCustomState(hex)
    setAccentState('custom')
  }
  const [subScreen, setSubScreen] = useState(null) // 'cycle' | 'groups' | 'exercises' | 'data' | 'appearance' | 'preferences' | null

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
  const [notice, setNotice] = useState(null) // { text, detail, error } shown as a banner on Data & backup
  const fileRef = useRef(null)
  const [confirmDialog, confirm] = useConfirm()

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${todayIso().replaceAll('-', '')}_training-data.json` // 20261125_training-data.json
    a.click()
    URL.revokeObjectURL(a.href)
    setNotice({ text: 'Backup downloaded' })
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
      const workouts = data.cycles.reduce((n, c) => n + Object.keys(c.finished).length, 0)
      setNotice({
        text: 'Backup restored',
        detail: `${data.cycles.length} ${data.cycles.length === 1 ? 'cycle' : 'cycles'}, ${workouts} finished ${workouts === 1 ? 'workout' : 'workouts'}.`,
      })
    } catch {
      setNotice({ text: "That file isn't a training plan backup.", error: true })
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
    setNotice({ text: 'Sample data loaded' })
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
    setNotice(null)
    cancelRM()
    window.scrollTo(0, 0)
  }
  if (subScreen === 'groups') return <GroupsEditor state={state} onBack={() => show('cycle')} />
  if (subScreen === 'exercises') return <Exercises state={state} onBack={() => show(null)} />
  if (subScreen === 'preferences')
    return (
      <div className="screen">
        <ScreenHeader title="Preferences" backLabel="Back to settings" onBack={() => show(null)} />
        {/* One block per preference (control and its note), divided by lines */}
        <section className="card">
          <div className="pref">
            <div className="row unit-row">
              <h3>Units</h3>
              <Segmented
                label="Weight unit"
                options={UNITS.map((u) => ({ id: u, label: u }))}
                value={unit()}
                onChange={(u) => update((d) => void (d.unit = u))}
              />
            </div>
            <p className="muted small">Affects just the label. Numbers are not converted.</p>
          </div>
          <div className="pref">
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
            <p className="muted small">Applies to main lifts only.</p>
          </div>
          <div className="pref">
            <div className="row unit-row">
              <h3>Date format</h3>
              <Segmented
                label="Date format"
                options={DATE_FORMATS}
                value={dateFormat()}
                onChange={(f) => update((d) => void (d.dateFormat = f))}
              />
            </div>
          </div>
        </section>
      </div>
    )
  if (subScreen === 'appearance')
    return (
      <div className="screen">
        <ScreenHeader title="Appearance & behavior" backLabel="Back to settings" onBack={() => show(null)} />
        <section className="card">
          <div className="pref">
            <div className="row unit-row">
              <h3>Mode</h3>
              <Segmented label="Mode" options={THEMES} value={theme} onChange={changeTheme} />
            </div>
            <p className="muted small">Auto follows your device. Kept on this device only.</p>
          </div>
          <div className="pref">
            <h3>Accent color</h3>
            <div className="swatches" role="radiogroup" aria-label="Accent color">
              {ACCENTS.map((x) => (
                <button
                  key={x.id}
                  className="swatch"
                  role="radio"
                  aria-checked={accent === x.id}
                  aria-label={x.label}
                  data-accent={x.id}
                  onClick={() => changeAccent(x.id)}
                />
              ))}
              {/* Tapping opens the system colour picker; the colour applies while picking */}
              <label className="swatch" data-accent="custom" style={custom ? { "--custom": custom } : undefined} data-checked={accent === 'custom'} data-picked={custom ? '' : undefined}>
                <input
                  type="color"
                  aria-label={accent === 'custom' ? 'Custom color, selected' : 'Custom color'}
                  value={custom ?? '#6e56cf'}
                  onClick={() => custom && changeAccent('custom')}
                  onChange={(e) => pickCustom(e.target.value)}
                />
              </label>
            </div>
            <p className="muted small">
              {accent === 'custom'
                ? 'Custom. Adjusted a little to stay readable. Kept on this device only.'
                : `${ACCENTS.find((x) => x.id === accent).label}. Kept on this device only.`}
            </p>
          </div>
        {'wakeLock' in navigator && (
          <div className="pref">
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
            <p className="muted small">Prevents screen lock during a session.</p>
          </div>
        )}
        </section>
        <section className="card">
          <div className="pref">
            <h3>App icon</h3>
            <div className="icon-choices" role="radiogroup" aria-label="App icon">
              {ICONS.map((x) => (
                <button key={x.id} className="icon-choice" role="radio" aria-checked={appIcon === x.id} onClick={() => changeAppIcon(x.id)}>
                  <img
                    src={(x.id === 'custom' && (customised ? customIconUrl(iconColor, iconSymbol, 128, symbolColor) : placeholderIconUrl(128))) || `${import.meta.env.BASE_URL}${x.id === 'dark' ? 'icon-dark.svg' : 'icon.svg'}`}
                    alt=""
                    width="64"
                    height="64"
                  />
                  <span>{x.label}</span>
                </button>
              ))}
            </div>
            {appIcon === 'custom' && (
              <div className="icon-custom">
                <div className="row unit-row">
                  <h3>Background color</h3>
                  <label className="color-dot" style={{ '--dot': iconColor }}>
                    <input type="color" aria-label="Icon color" value={iconColor} onChange={(e) => pickIconColor(e.target.value)} />
                  </label>
                </div>
                <h3>Symbol</h3>
                <div className="symbol-grid" role="radiogroup" aria-label="Icon symbol">
                  {SYMBOLS.map((x) => (
                    <button
                      key={x.id}
                      className="symbol-choice"
                      role="radio"
                      aria-checked={iconSymbol === x.id}
                      aria-label={x.label}
                      onClick={() => pickIconSymbol(x.id)}
                    >
                      <svg viewBox="0 0 512 512" width="28" height="28" aria-hidden="true" fill="currentColor">
                        <path d={x.d} fillRule={x.evenodd ? 'evenodd' : 'nonzero'} />
                      </svg>
                    </button>
                  ))}
                </div>
                <div className="row unit-row">
                  <h3>Symbol color</h3>
                  <label className="color-dot" style={{ '--dot': symbolColorFor(iconColor, symbolColor) }}>
                    <input
                      type="color"
                      aria-label="Symbol color"
                      value={symbolColorFor(iconColor, symbolColor)}
                      onChange={(e) => pickSymbolColor(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            )}
            <p className="muted small">
              To change the icon on your home screen, remove the app (don't forget to backup your data!) and install it again.
            </p>
          </div>
        </section>
      </div>
    )
  if (subScreen === 'data')
    return (
      <div className="screen">
        <ScreenHeader title="Data & backup" backLabel="Back to settings" onBack={() => show(null)} />
        {/* Result of the last export, import or sample data, on top where it can't be missed */}
        {notice && (
          <div className={`notice ${notice.error ? 'is-error' : ''}`} role={notice.error ? 'alert' : 'status'}>
            <span className="notice-icon" aria-hidden="true">{notice.error ? '!' : '✓'}</span>
            <div>
              <strong>{notice.text}</strong>
              {notice.detail && <p className="small">{notice.detail}</p>}
            </div>
          </div>
        )}
        <section className="card">
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
            {/* No file type filter: only the content counts, whatever the file is called */}
            <input ref={fileRef} type="file" hidden onChange={importData} />
          </div>
          <button onClick={loadSample}>Use sample data</button>
        </section>
        <section className="card">
          <h2>Reset</h2>
          <button className="danger" onClick={resetAll}>Delete all data</button>
        </section>
        {confirmDialog}
      </div>
    )

  // Main lifts with their 1RM, empty slots left out (on the Settings card and the sub-screen)
  const liftList = (
    <div className="list">
      {lifts.map((id) => (
        <div className="row list-row static" key={id}>
          <span>{exerciseName(state, id)}</span>
          <span>{fmt(cycle.oneRM[id])} {unit()}</span>
        </div>
      ))}
    </div>
  )

  if (subScreen === 'cycle')
    return (
      <div className="screen">
        <ScreenHeader title="Current cycle" backLabel="Back to settings" onBack={() => show(null)} />
        <section className="card">
          <div className="row inline-field">
            <h3>Program</h3>
            <span className="small">{program.name}</span>
          </div>

          <div className="row inline-field">
            <h3>{cycleStarted(cycle) ? 'Start date' : <label htmlFor="start-date">Start date</label>}</h3>
            {cycleStarted(cycle) ? (
              <span>{fmtDate(cycle.startDate)}</span>
            ) : (
              <input
                id="start-date"
                type="date"
                value={cycle.startDate}
                onChange={(e) => e.target.value && updateCycle((c) => void (c.startDate = e.target.value))}
              />
            )}
          </div>
          {cycleStarted(cycle) && <p className="muted small">Fixed once the first session is started.</p>}

          <div className="row inline-field">
            <h3>End date</h3>
            <span>{fmtDate(cycleEnd(cycle))}</span>
          </div>

          <div className="row subhead">
            <h3>
              Main lifts <span className="head-note">(current 1RMs)</span>
            </h3>
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
            liftList
          )}

          <GroupsSummary state={state} onEdit={() => show('groups')} />

          {!draft && (
            <button className="new-cycle" onClick={() => setNewCycleOpen(true)}>
              Start a new cycle
            </button>
          )}
          {newCycleOpen && <NewCycleDialog state={state} onClose={() => setNewCycleOpen(false)} />}
        </section>
      </div>
    )

  return (
    <div className="screen">
      <h1>Settings</h1>

      {/* Read-only overview; tapping anywhere on the card opens the Current cycle screen to edit it */}
      <section className="card nav-section">
        <h2 className="nav-head">
          <button onClick={() => show('cycle')}>
            Current cycle
            <span className="nav-head-end">
              <span className="muted small">{cycleRange(cycle)}</span>
              <Chevron />
            </span>
          </button>
        </h2>
        {/* Which program the cycle follows, and its shape */}
        <p className="cycle-program muted small">
          {program.name}
          <br />
          {program.weekCount} weeks · {perWeek} {perWeek === '1' ? 'session' : 'sessions'} a week
        </p>
        {/* Start = the 1RM the cycle is built on, → Goal = the week-9 single */}
        <div className="lift-table">
          {lifts.map((id) => (
            <div className="lift-row" key={id}>
              <span>{exerciseName(state, id)}</span>
              <span><span className="sr-only">Start </span>{fmt(cycle.oneRM[id])} {unit()}</span>
              <span className="muted" aria-hidden="true">→</span>
              <strong><span className="sr-only">Goal </span>{fmt(goalWeight(cycle, id))} {unit()}</strong>
            </div>
          ))}
        </div>
      </section>

      <NavCard title="Exercise catalog" onClick={() => show('exercises')} />

      <NavCard title="Data & backup" onClick={() => show('data')} />

      <NavCard title="Appearance & behavior" onClick={() => show('appearance')} />

      <NavCard title="Preferences" onClick={() => show('preferences')} />

      {confirmDialog}
      <p className="muted small center">Version {__APP_VERSION__}</p>
    </div>
  )
}

/** A card that opens another screen: tappable as a whole, with a chevron on the right. */
function NavCard({ title, onClick }) {
  return (
    <button className="card nav-card" onClick={onClick}>
      <span className="nav-card-text">
        <span className="nav-card-title">{title}</span>
      </span>
      <Chevron />
    </button>
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
