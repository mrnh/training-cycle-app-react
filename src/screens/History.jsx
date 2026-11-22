import { useState } from 'react'
import FinishedSession from '../components/FinishedSession'
import { entryAsPrescribed, finishedWorkouts, fmtDateShort, sessionName } from '../program'

/**
 * History tab: every finished workout, newest first, as one table. Date and session span the
 * workout's rows; then one row per main lift, one for the accessory group and one per exercise
 * added during the workout, each with a check: green when done as prescribed, orange-yellow otherwise.
 * Tapping a workout (of any cycle) opens its finished session with all sets and weights; the
 * back arrow returns to the list at the same scroll position.
 */
export default function History({ state }) {
  const workouts = finishedWorkouts(state)
  const current = state.cycles.length - 1
  const [detail, setDetail] = useState(null) // { cycle, plan, record, scrollY } while one is open

  if (detail) {
    const back = () => {
      const y = detail.scrollY
      setDetail(null)
      requestAnimationFrame(() => window.scrollTo(0, y))
    }
    return (
      <div className="screen">
        <header className="session-head">
          <button className="icon" aria-label="Back" onClick={back}>
            ‹
          </button>
          <div>
            <h1>{sessionName(detail.plan)}</h1>
            <p className="muted small">
              {detail.cycle !== current && `Cycle ${detail.cycle + 1} · `}Group {detail.record.group}
            </p>
          </div>
          <span className="icon-spacer" />
        </header>
        <FinishedSession record={detail.record} />
      </div>
    )
  }

  return (
    <div className="screen">
      <h1>History</h1>
      {workouts.length === 0 ? (
        <p className="muted small center">No finished workouts yet.</p>
      ) : (
        <div className="card history-card">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Session</th>
                <th>Exercise</th>
                <th>
                  <span className="sr-only">Done as prescribed</span>
                </th>
              </tr>
            </thead>
            {workouts.map(({ cycle, plan, record }) => {
              const rows = workoutRows(record)
              const open = () => {
                setDetail({ cycle, plan, record, scrollY: window.scrollY })
                window.scrollTo(0, 0)
              }
              // Each workout is its own row group, so it can be tapped as a whole
              return (
                <tbody
                  key={`${cycle}:${plan.key}`}
                  className="tappable"
                  onClick={open}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open session ${plan.week}.${plan.session}${cycle !== current ? `, cycle ${cycle + 1}` : ''}`}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open())}
                >
                  {rows.map((r, i) => (
                    <tr key={r.key}>
                      {i === 0 && (
                        <>
                          <td rowSpan={rows.length} className="when">
                            {record.finishedAt ? fmtDateShort(record.finishedAt) : '–'}
                            {cycle !== current && <span className="muted"> · C{cycle + 1}</span>}
                          </td>
                          <td rowSpan={rows.length} className="when">
                            {plan.week}.{plan.session}
                          </td>
                        </>
                      )}
                      <td className="name">{r.name}</td>
                      <td className="check">
                        <span className={r.ok ? 'ok' : 'off'} aria-label={r.ok ? 'done as prescribed' : 'not as prescribed'}>
                          ✓
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )
            })}
          </table>
        </div>
      )}
    </div>
  )
}

/** The rows of one workout: main lifts, the accessory group, then exercises added during it. */
function workoutRows(record) {
  const main = record.entries.filter((e) => e.kind === 'main')
  const group = record.entries.filter((e) => e.kind === 'secondary' && !e.added)
  const added = record.entries.filter((e) => e.kind === 'secondary' && e.added)
  const row = (e, kind) => ({ key: `${kind}-${e.exerciseId}`, name: e.name, ok: entryAsPrescribed(e) })
  return [
    ...main.map((e) => row(e, 'm')),
    ...(group.length ? [{ key: 'group', name: `Accessory work ${record.group}`, ok: group.every(entryAsPrescribed) }] : []),
    ...added.map((e) => row(e, 'a')),
  ]
}
