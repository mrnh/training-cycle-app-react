import { useRef, useState } from 'react'
import GroupsSummary, { GroupsEditor } from '../components/Groups'
import MainLiftFields from '../components/MainLiftFields'
import Segmented from '../components/Segmented'
import StartCycle from '../components/StartCycle'
import useConfirm from '../components/useConfirm'
import Chevron from '../components/Chevron'
import Exercises from './Exercises'
import { DATE_FORMATS, ROUNDINGS, ROUNDING_MODES, UNITS, dateFormat, rounding, roundingMode, exerciseName, fmt, basisOf, programName, sessionsPerWeekText, abortCycle, cycleAborted, cycleEnd, cycleRange, cycleStarted, fmtDate, goalWeight, heaviestWeight, mainLiftsError, isFinished, programOf, todayIso, unit, activeSession, sessionName } from '../program'
import { currentCycle, migrate, replaceState, update, updateCycle } from '../store'
import { sampleState } from '../sampleData'
import ScreenHeader from '../components/ScreenHeader'
import { SYMBOLS } from '../iconSymbols'
import { ACCENTS, ICONS, THEMES, customIconUrl, isIconCustomised, placeholderIconUrl, getAccent, getAppIcon, getIconColor, getIconSymbol, getIconSymbolColor, setIconSymbolColor, symbolColorFor, setAppIcon, setIconColor, setIconSymbol, getCustomAccent, getTheme, setAccent, setCustomAccent, setTheme } from '../theme'
import { LANGUAGE_OPTIONS, getLanguage, t } from '../i18n'

// Running as an installed home-screen app (not in a browser tab)
const installed = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true

export default function Settings({ state }) {
  const cycle = currentCycle(state)
  const lifts = cycle.primaries.filter(Boolean) // empty slots left out
  const program = programOf(cycle)
  const doneCount = program.sessions.filter((p) => isFinished(cycle, p)).length
  const perWeek = sessionsPerWeekText(program)
  const [draft, setDraft] = useState(null) // [{ id, rm }] per main-lift slot while editing; null = not editing
  const [rmError, setRmError] = useState('')
  const [newCycleOpen, setNewCycleOpen] = useState(false)
  const [theme, setThemeState] = useState(getTheme)
  const changeTheme = (mode) => {
    setTheme(mode)
    setThemeState(mode)
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
    setNotice({ text: t('settings.backupDownloaded') })
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
        title: t('settings.restoreTitle'),
        message: t('settings.restoreMessage'),
        confirmLabel: t('settings.restore'),
        danger: true,
      })
      if (!ok) return
      replaceState(data)
      const workouts = data.cycles.reduce((n, c) => n + Object.keys(c.finished).length, 0)
      setNotice({
        text: t('settings.restored'),
        detail: t('settings.restoredDetail', { cycles: t('settings.cyclesCount', { count: data.cycles.length }), workouts: t('settings.workoutsCount', { count: workouts }) }),
      })
    } catch {
      setNotice({ text: t('settings.notBackup'), error: true })
    }
  }

  async function loadSample() {
    const ok = await confirm({
      title: t('settings.sampleTitle'),
      message: t('settings.sampleMessage'),
      confirmLabel: t('settings.sampleConfirm'),
      danger: true,
    })
    if (!ok) return
    replaceState(sampleState({ unit: state.unit, dateFormat: state.dateFormat }))
    setNotice({ text: t('settings.sampleLoaded') })
  }

  async function resetAll() {
    const ok = await confirm({
      title: t('settings.deleteTitle'),
      message: t('settings.deleteMessage'),
      confirmLabel: t('settings.deleteConfirm'),
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
        <ScreenHeader title={t('settings.preferences')} backLabel={t('settings.back')} onBack={() => show(null)} />
        {/* One block per preference (control and its note), divided by lines */}
        <section className="card">
          <div className="pref">
            <div className="row unit-row">
              <h3>{t('settings.language')}</h3>
              <Segmented
                label={t('settings.language')}
                options={LANGUAGE_OPTIONS.map((l) => ({ id: l.id, label: l.flag, name: l.name, flag: true }))}
                value={getLanguage()}
                onChange={(l) => update((d) => void (d.language = l))}
              />
            </div>
          </div>
          <div className="pref">
            <div className="row unit-row">
              <h3>{t('settings.units')}</h3>
              <Segmented
                label={t('settings.weightUnit')}
                options={UNITS.map((u) => ({ id: u, label: u }))}
                value={unit()}
                onChange={(u) => update((d) => void (d.unit = u))}
              />
            </div>
            <p className="muted small">{t('settings.unitHint')}</p>
          </div>
          <div className="pref">
            <div className="row unit-row">
              <h3>{t('settings.rounding')}</h3>
              <Segmented
                label={t('settings.roundingDirection')}
                options={ROUNDING_MODES.map((m) => ({ id: m.id, label: t(`rounding.${m.id}`) }))}
                value={roundingMode()}
                onChange={(m) => update((d) => void (d.roundingMode = m))}
              />
            </div>
            <div className="row unit-row end">
              <Segmented
                label={t('settings.roundingPlanned')}
                options={ROUNDINGS.map((r) => ({ id: r, label: `${r === 0.1 ? '.1' : r} ${unit()}` }))}
                value={rounding()}
                onChange={(r) => update((d) => void (d.rounding = r))}
              />
            </div>
            <p className="muted small">{t('settings.roundingHint')}</p>
          </div>
          <div className="pref">
            <div className="row unit-row">
              <h3>{t('settings.dateFormat')}</h3>
              <Segmented
                label={t('settings.dateFormat')}
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
        <ScreenHeader title={t('settings.appearance')} backLabel={t('settings.back')} onBack={() => show(null)} />
        <section className="card">
          <div className="pref">
            <div className="row unit-row">
              <h3>{t('settings.mode')}</h3>
              <Segmented label={t('settings.mode')} options={THEMES.map((x) => ({ id: x.id, label: t(`settings.theme.${x.id}`) }))} value={theme} onChange={changeTheme} />
            </div>
            <p className="muted small">{t('settings.modeHint')}</p>
          </div>
          <div className="pref">
            <h3>{t('settings.accentColor')}</h3>
            <div className="swatches" role="radiogroup" aria-label={t('settings.accentColor')}>
              {ACCENTS.map((x) => (
                <button
                  key={x.id}
                  className="swatch"
                  role="radio"
                  aria-checked={accent === x.id}
                  aria-label={t(`settings.accent.${x.id}`)}
                  data-accent={x.id}
                  onClick={() => changeAccent(x.id)}
                />
              ))}
              {/* Tapping opens the system colour picker; the colour applies while picking */}
              <label className="swatch" data-accent="custom" style={custom ? { "--custom": custom } : undefined} data-checked={accent === 'custom'} data-picked={custom ? '' : undefined}>
                <input
                  type="color"
                  aria-label={accent === 'custom' ? t('settings.customColorSelected') : t('settings.customColor')}
                  value={custom ?? '#6e56cf'}
                  onClick={() => custom && changeAccent('custom')}
                  onChange={(e) => pickCustom(e.target.value)}
                />
              </label>
            </div>
            <p className="muted small">
              {accent === 'custom'
                ? t('settings.accentCustomHint')
                : t('settings.accentHint', { name: t(`settings.accent.${accent}`) })}
            </p>
          </div>
        {'wakeLock' in navigator && (
          <div className="pref">
            <div className="row unit-row">
              <h3>{t('settings.keepScreen')}</h3>
              <Segmented
                label={t('settings.keepScreenAria')}
                options={[
                  { id: false, label: t('settings.off') },
                  { id: true, label: t('settings.on') },
                ]}
                value={state.keepAwake !== false}
                onChange={(on) => update((d) => void (d.keepAwake = on))}
              />
            </div>
            <p className="muted small">{t('settings.keepScreenHint')}</p>
          </div>
        )}
        </section>
        <section className="card">
          <div className="pref">
            <h3>{t('settings.appIcon')}</h3>
            <div className="icon-choices" role="radiogroup" aria-label={t('settings.appIcon')}>
              {ICONS.map((x) => (
                <button key={x.id} className="icon-choice" role="radio" aria-checked={appIcon === x.id} onClick={() => changeAppIcon(x.id)}>
                  <img
                    src={(x.id === 'custom' && (customised ? customIconUrl(iconColor, iconSymbol, 128, symbolColor) : placeholderIconUrl(128))) || `${import.meta.env.BASE_URL}${x.id === 'dark' ? 'icon-dark.svg' : 'icon.svg'}`}
                    alt=""
                    width="64"
                    height="64"
                  />
                  <span>{t(`settings.icon.${x.id}`)}</span>
                </button>
              ))}
            </div>
            {appIcon === 'custom' && (
              <div className="icon-custom">
                <div className="row unit-row">
                  <h3>{t('settings.backgroundColor')}</h3>
                  <label className="color-dot" style={{ '--dot': iconColor }}>
                    <input type="color" aria-label={t('settings.iconColorAria')} value={iconColor} onChange={(e) => pickIconColor(e.target.value)} />
                  </label>
                </div>
                <h3>{t('settings.symbolHeading')}</h3>
                <div className="symbol-grid" role="radiogroup" aria-label={t('settings.symbolGroup')}>
                  {SYMBOLS.map((x) => (
                    <button
                      key={x.id}
                      className="symbol-choice"
                      role="radio"
                      aria-checked={iconSymbol === x.id}
                      aria-label={t(`settings.symbol.${x.id}`)}
                      onClick={() => pickIconSymbol(x.id)}
                    >
                      <svg viewBox="0 0 512 512" width="28" height="28" aria-hidden="true" fill="currentColor">
                        <path d={x.d} fillRule={x.evenodd ? 'evenodd' : 'nonzero'} />
                      </svg>
                    </button>
                  ))}
                </div>
                <div className="row unit-row">
                  <h3>{t('settings.symbolColor')}</h3>
                  <label className="color-dot" style={{ '--dot': symbolColorFor(iconColor, symbolColor) }}>
                    <input
                      type="color"
                      aria-label={t('settings.symbolColor')}
                      value={symbolColorFor(iconColor, symbolColor)}
                      onChange={(e) => pickSymbolColor(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            )}
            <p className="muted small">
              {t('settings.iconHint')}
            </p>
          </div>
        </section>
      </div>
    )
  if (subScreen === 'data')
    return (
      <div className="screen">
        <ScreenHeader title={t('settings.data')} backLabel={t('settings.back')} onBack={() => show(null)} />
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
          <p className="muted small">{t('settings.dataIntro')}</p>
          {/* In the browser (not the installed app): on iPhone the home-screen app has its own,
              empty storage, so the data has to be carried over once */}
          {!installed && (
            <p className="muted small">
              {t('settings.iphoneHint')}
            </p>
          )}
          <div className="button-row">
            <button onClick={exportData}>{t('settings.export')}</button>
            <button onClick={() => fileRef.current.click()}>{t('settings.import')}</button>
            {/* No file type filter: only the content counts, whatever the file is called */}
            <input ref={fileRef} type="file" hidden onChange={importData} />
          </div>
          <button onClick={loadSample}>{t('settings.useSample')}</button>
        </section>
        <section className="card">
          <h2>{t('settings.reset')}</h2>
          <button className="danger" onClick={resetAll}>{t('settings.deleteAll')}</button>
        </section>
        {confirmDialog}
      </div>
    )

  // Main lifts, start 1RM → goal (empty slots left out): the Settings card and the Current cycle screen
  const liftTable = (
    <div className="lift-table">
      {lifts.map((id) => (
        <div className="lift-row" key={id}>
          <span>{exerciseName(state, id)}</span>
          {goalWeight(cycle, id) == null ? (
            // No goal (no re-test in the program): just the number
            <span className="lift-only">{fmt(cycle.oneRM[id])} {unit()}</span>
          ) : (
            <>
              <span><span className="sr-only">{t('cycle.start')} </span>{fmt(cycle.oneRM[id])} {unit()}</span>
              <span className="muted" aria-hidden="true">→</span>
              <strong><span className="sr-only">{t('cycle.goal')} </span>{fmt(goalWeight(cycle, id))} {unit()}</strong>
            </>
          )}
        </div>
      ))}
    </div>
  )

  async function abort() {
    const open = activeSession(cycle)
    const ok = await confirm({
      title: t('cycle.abortTitle'),
      message: open ? t('cycle.abortMessageOpen', { session: sessionName(open) }) : t('cycle.abortMessage'),
      confirmLabel: t('cycle.abort'),
      danger: true,
    })
    if (ok) update((d) => abortCycle(d, currentCycle(d)))
  }

  if (subScreen === 'cycle' && newCycleOpen) return <StartCycle state={state} onClose={() => setNewCycleOpen(false)} />
  if (subScreen === 'cycle')
    return (
      <div className="screen">
        <ScreenHeader title={t('cycle.title')} backLabel={t('settings.back')} onBack={() => show(null)} />
        <section className="card">
          <h3>{programName(program)}</h3>
          <div className="cycle-dates">
            <p className="muted small">
              {fmtDate(cycle.startDate)} – {fmtDate(cycleEnd(cycle))}
              {cycleAborted(cycle) && <><br />{t('cycle.aborted', { date: fmtDate(cycle.abortedAt) })}</>}
            </p>
            {/* Finished sessions of the cycle, as on Overview */}
            <div className="cycle-progress muted small">
              <div className="bar" role="progressbar" aria-label={t('cycle.sessionsDone')} aria-valuenow={doneCount} aria-valuemax={program.sessions.length}>
                <div style={{ width: `${(doneCount / program.sessions.length) * 100}%` }} />
              </div>
              <span>{doneCount}/{program.sessions.length}</span>
            </div>
          </div>

          {/* Until the first session is started, the start date can still be moved */}
          {!cycleStarted(cycle) && (
            <div className="row inline-field">
              <h3>
                <label htmlFor="start-date">{t('cycle.startDate')}</label>
              </h3>
              <input
                id="start-date"
                type="date"
                value={cycle.startDate}
                onChange={(e) => e.target.value && updateCycle((c) => void (c.startDate = e.target.value))}
              />
            </div>
          )}

          {/* Main lifts and 1RMs are fixed once the cycle has started: then just the table, no heading or pen */}
          {!cycleStarted(cycle) && (
            <div className="row subhead">
              <h3>{t('cycle.mainLifts')}</h3>
              {!draft && (
                <button
                  className="sec-pen"
                  aria-label={t('cycle.editMainLifts')}
                  onClick={() => setDraft(cycle.primaries.map((id) => ({ id: id ?? '', rm: id ? (cycle.oneRM[id] ?? null) : null })))}
                >
                  ✎
                </button>
              )}
            </div>
          )}

          {draft ? (
            <>
              <p className="warning small">{t('cycle.liftsWarning')}</p>
              <MainLiftFields
                basis={basisOf(program)}
                rows={draft}
                catalog={state.catalog}
                prefill={(id) => heaviestWeight(state, id)}
                onChange={(rows) => {
                  setRmError('')
                  setDraft(rows)
                }}
              />
              <p className="muted small">{t('cycle.prefillHint')}</p>
              {rmError && <p className="error">{rmError}</p>}
              <div className="button-row end">
                <button onClick={cancelRM}>{t('common.cancel')}</button>
                <button className="primary" onClick={saveRM}>{t('common.save')}</button>
              </div>
            </>
          ) : (
            liftTable
          )}

          <GroupsSummary state={state} onEdit={() => show('groups')} />

          {!draft &&
            (cycleAborted(cycle) ? (
              <button
                className="new-cycle"
                onClick={() => {
                  setNewCycleOpen(true)
                  window.scrollTo(0, 0)
                }}
              >
                {t('cycle.startNew')}
              </button>
            ) : (
              <button className="new-cycle danger" onClick={abort}>
                {t('cycle.abort')}
              </button>
            ))}
        </section>
        {confirmDialog}
      </div>
    )

  return (
    <div className="screen">
      <h1>{t('settings.title')}</h1>

      {/* Read-only overview; tapping anywhere on the card opens the Current cycle screen to edit it */}
      <section className="card nav-section">
        <h2 className="nav-head">
          <button onClick={() => show('cycle')}>
            {t('cycle.title')}
            <span className="nav-head-end">
              <span className="muted small">{cycleRange(cycle)}</span>
              <Chevron />
            </span>
          </button>
        </h2>
        {/* Which program the cycle follows, and its shape */}
        <p className="cycle-program muted small">
          {programName(program)}
          <br />
          {t('cycle.weeks', { count: program.weekCount })} · {t('cycle.perWeek', { count: perWeek.count, value: perWeek.text })}
          {cycleAborted(cycle) && <><br />{t('cycle.aborted', { date: fmtDate(cycle.abortedAt) })}</>}
        </p>
        {/* Start = the 1RM the cycle is built on, → Goal = the week-9 single */}
        {liftTable}
      </section>

      <NavCard title={t('settings.catalog')} onClick={() => show('exercises')} />

      <NavCard title={t('settings.data')} onClick={() => show('data')} />

      <NavCard title={t('settings.appearance')} onClick={() => show('appearance')} />

      <NavCard title={t('settings.preferences')} onClick={() => show('preferences')} />

      {confirmDialog}
      <p className="muted small center">{t('settings.version', { version: __APP_VERSION__ })}</p>
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
