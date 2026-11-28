import { useState } from 'react'
import {
  activeSession, sessionName, cycleComplete, exerciseName, fmt, isFinished, liftOf, mainLifts, nextCycleNumbers, nextSession, programOf,
  mainPrescription, prescriptionText, unit, weekRange,
} from '../program'
import { currentCycle } from '../store'
import StartCycle from '../components/StartCycle'
import { t } from '../i18n'

export default function Plan({ state, onOpen }) {
  const cycle = currentCycle(state)
  const [starting, setStarting] = useState(null) // the numbers to start the next cycle from, while its setup is open
  const active = activeSession(cycle)
  const next = active ?? nextSession(cycle)
  const program = programOf(cycle)
  const sessions = program.sessions
  const doneCount = sessions.filter((p) => isFinished(cycle, p)).length
  if (starting) return <StartCycle state={state} numbers={starting} onClose={() => setStarting(null)} />

  return (
    <div className="screen plan">
      {next && (
        <button className="card next-up" onClick={() => onOpen(next.key)}>
          <span className="muted small">{active ? t('plan.inProgress') : t('plan.nextUp')}</span>
          <strong>{sessionName(next)}</strong>
          <span className="small">
            {mainLifts(cycle, next)
              .map((p) => t('plan.liftLine', { name: exerciseName(state, liftOf(cycle, p)), text: prescriptionText(mainPrescription(cycle, p)) }))
              .join(' · ') || t('plan.accessoryOnly', { group: next.group })}
          </span>
        </button>
      )}

      {cycleComplete(cycle) && (
        <NextCycle
          state={state}
          onStart={(numbers) => {
            setStarting(numbers)
            window.scrollTo(0, 0)
          }}
        />
      )}

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

/** The finished cycle: the numbers the next one suggests, and the way into its setup. */
function NextCycle({ state, onStart }) {
  const cycle = currentCycle(state)
  const program = programOf(cycle)
  const numbers = nextCycleNumbers(cycle)
  const basis = program.chosen.tmInput ? '_tm' : ''

  return (
    <div className="card highlight">
      <strong>{t('nextCycle.complete')}</strong>
      <p className="muted small">{program.increase ? t(`nextCycle.suggested${basis}`) : t('nextCycle.newRms', { week: program.weekCount })}</p>
      {Object.entries(numbers).map(([id, n]) => (
        <div className="row small" key={id}>
          <span>{exerciseName(state, id)}</span>
          {n.increase != null ? (
            <span>
              {fmt(cycle.oneRM[id])} → <strong>{fmt(n.value)} {unit()}</strong> <span className="muted">(+{fmt(n.increase)})</span>
            </span>
          ) : n.result ? (
            <span>
              {fmt(cycle.oneRM[id])} → <strong>{fmt(n.value)} {unit()}</strong>
            </span>
          ) : (
            <span>
              <strong>{fmt(n.value)} {unit()}</strong> <span className="muted">{t('nextCycle.kept')}</span>
            </span>
          )}
        </div>
      ))}
      <p className="muted small">{t('nextCycle.change')}</p>
      <button className="primary" onClick={() => onStart(Object.fromEntries(Object.entries(numbers).map(([id, n]) => [id, n.value])))}>
        {t('nextCycle.start')}
      </button>
    </div>
  )
}
