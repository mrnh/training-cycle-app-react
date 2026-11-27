import { useState } from 'react'
import {
  activeSession, sessionName, cycleComplete, exerciseName, fmt, isFinished, liftOf, mainLifts, nextSession, programOf,
  retestResults, targetWeight, todayIso, unit, weekRange,
} from '../program'
import { currentCycle, newCycle, update } from '../store'
import useConfirm from '../components/useConfirm'
import { t } from '../i18n'

export default function Plan({ state, onOpen }) {
  const cycle = currentCycle(state)
  const active = activeSession(cycle)
  const next = active ?? nextSession(cycle)
  const program = programOf(cycle)
  const sessions = program.sessions
  const doneCount = sessions.filter((p) => isFinished(cycle, p)).length

  return (
    <div className="screen plan">
      {next && (
        <button className="card next-up" onClick={() => onOpen(next.key)}>
          <span className="muted small">{active ? t('plan.inProgress') : t('plan.nextUp')}</span>
          <strong>{sessionName(next)}</strong>
          <span className="small">
            {mainLifts(cycle, next)
              .map((p) => t('plan.liftLine', { name: exerciseName(state, liftOf(cycle, p)), sets: p.sets, reps: p.reps, weight: fmt(targetWeight(cycle, p)), unit: unit() }))
              .join(' · ') || t('plan.accessoryOnly', { group: next.group })}
          </span>
        </button>
      )}

      {cycleComplete(cycle) && <NextCycle state={state} />}

      <div className="weeks">
        {program.weeks.map((plans, w) => {
          const week = w + 1
          return (
            <div className="week" key={week}>
              <span className="week-label">
                {t('plan.week', { n: week })}
                <span className="muted small">{weekRange(cycle, week)}</span>
              </span>
              <span className="dots">
                {plans.map((plan) => {
                  const s = plan.session
                  const complete = isFinished(cycle, plan)
                  const cls = complete ? 'done' : active?.key === plan.key ? 'partial' : next?.key === plan.key ? 'next' : ''
                  return (
                    <button
                      key={s}
                      className={`dot ${cls}`}
                      aria-label={complete ? t('plan.sessionDone', { session: sessionName(plan) }) : cls === 'partial' ? t('plan.sessionInProgress', { session: sessionName(plan) }) : sessionName(plan)}
                      onClick={() => onOpen(plan.key)}
                    >
                      {s}
                    </button>
                  )
                })}
              </span>
            </div>
          )
        })}
      </div>

      <div className="bar" role="progressbar" aria-valuenow={doneCount} aria-valuemax={sessions.length}>
        <div style={{ width: `${(doneCount / sessions.length) * 100}%` }} />
      </div>
      <p className="muted small">{t('plan.sessionsDone', { done: doneCount, total: sessions.length })}</p>
    </div>
  )
}

function NextCycle({ state }) {
  const cycle = currentCycle(state)
  const program = programOf(cycle)
  const results = retestResults(cycle)
  const [date, setDate] = useState(todayIso())
  // A re-test that wasn't ticked keeps the old 1RM (it can be changed in Settings)
  const lifts = cycle.primaries.filter(Boolean)
  const newRM = Object.fromEntries(lifts.map((id) => [id, results[id] ?? cycle.oneRM[id]]))

  const [confirmDialog, confirm] = useConfirm()
  async function start() {
    const ok = await confirm({
      title: t('nextCycle.confirmTitle'),
      message: t('nextCycle.confirmMessage', { weeks: program.weekCount }),
      confirmLabel: t('nextCycle.confirm'),
    })
    if (!ok) return
    update((d) => d.cycles.push(newCycle(date, newRM, cycle.primaries, cycle.program)))
  }

  return (
    <div className="card highlight">
      <strong>{t('nextCycle.complete')}</strong>
      <p className="muted small">{t('nextCycle.newRms', { week: program.weekCount })}</p>
      {lifts.map((id) => (
        <div className="row small" key={id}>
          <span>{exerciseName(state, id)}</span>
          {results[id] != null ? (
            <span>
              {fmt(cycle.oneRM[id])} → <strong>{fmt(newRM[id])} {unit()}</strong>
            </span>
          ) : (
            <span>
              <strong>{fmt(newRM[id])} {unit()}</strong> <span className="muted">{t('nextCycle.kept')}</span>
            </span>
          )}
        </div>
      ))}
      <p className="muted small">{t('nextCycle.change')}</p>
      <label className="field">
        <span>{t('nextCycle.starts')}</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <button className="primary" onClick={start} disabled={!date}>
        {t('nextCycle.start')}
      </button>
      {confirmDialog}
    </div>
  )
}
