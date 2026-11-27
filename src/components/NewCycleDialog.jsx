import { useState } from 'react'
import MainLiftFields from './MainLiftFields'
import Sheet from './Sheet'
import { activeSession, finishSession, heaviestWeight, isoDay, mainLiftsError, programOf, sessionName, todayIso } from '../program'
import { currentCycle, newCycle, update } from '../store'
import { t } from '../i18n'

/**
 * Start a new cycle before the current one is complete (e.g. after a break). The current
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
    if (!date) return setError(t('newCycle.pickDate'))
    const liftError = mainLiftsError(lifts)
    if (liftError) return setError(liftError)
    const oneRM = Object.fromEntries(lifts.filter((l) => l.id).map((l) => [l.id, l.rm]))
    update((d) => {
      const old = currentCycle(d)
      const openNow = activeSession(old)
      if (openNow) finishSession(d, old, openNow, isoDay(new Date()))
      old.timer = null
      d.cycles.push(newCycle(date, oneRM, lifts.map((l) => l.id || null), old.program))
    })
    onClose()
  }

  return (
    <Sheet onClose={onClose} onSubmit={start}>
      <h2>{t('newCycle.title')}</h2>
      <p className="small">
        {t('newCycle.intro', { weeks: programOf(cycle).weekCount })}
      </p>
      {open && <p className="warning small">{t('newCycle.openWarning', { session: sessionName(open) })}</p>}
      <label className="field">
        <span>{t('newCycle.startDate')}</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <div className="field">
        <span>{t('newCycle.lifts')}</span>
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
        <button type="button" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="primary">{t('newCycle.start')}</button>
      </div>
    </Sheet>
  )
}
