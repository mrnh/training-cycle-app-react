import { Fragment } from 'react'
import { entryComplete, finishedWorkouts, fmtDateShort, setsSummary } from '../program'

/**
 * History tab: every finished workout, newest first, as one table. Date and session span the
 * workout's rows; then one row per main lift (what was done), one for the accessory group and
 * one per exercise added during the workout. A row is grey when not every planned set was
 * ticked. Workouts of the current cycle open their finished session when tapped.
 */
export default function History({ state, onOpen }) {
  const workouts = finishedWorkouts(state)
  const current = state.cycles.length - 1

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
                <th>Sets</th>
              </tr>
            </thead>
            {workouts.map(({ cycle, plan, record }) => {
              const rows = workoutRows(record)
              const open = cycle === current ? () => onOpen(plan.key) : undefined
              // Each workout is its own row group, so it can be tapped as a whole
              return (
                <tbody
                  key={`${cycle}:${plan.key}`}
                  className={open ? 'tappable' : undefined}
                  onClick={open}
                  {...(open && {
                    role: 'button',
                    tabIndex: 0,
                    'aria-label': `Open session ${plan.week}.${plan.session}`,
                    onKeyDown: (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open()),
                  })}
                >
                  {rows.map((r, i) => (
                    <tr key={r.key} className={r.complete ? undefined : 'incomplete'}>
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
                      {/* The accessory row has no sets column, so its name gets the space */}
                      <td className="name" colSpan={r.value ? 1 : 2}>{r.name}</td>
                      {r.value && (
                        <td className="sets">
                          {/* Breaks only between groups ("4-4-4-3 @ 144 kg," / "4-3 @ 140 kg") */}
                          {r.value.split(', ').map((part, j, all) => (
                            <Fragment key={j}>
                              <span className="nowrap">{j < all.length - 1 ? `${part},` : part}</span>
                              {j < all.length - 1 && ' '}
                            </Fragment>
                          ))}
                        </td>
                      )}
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
  const done = (e) => setsSummary(e.sets.filter((s) => s.done)) || 'nothing ticked'
  const row = (e, kind) => ({ key: `${kind}-${e.exerciseId}`, name: e.name, value: done(e), complete: entryComplete(e) })
  return [
    ...main.map((e) => row(e, 'm')),
    ...(group.length ? [{ key: 'group', name: `Accessory work ${record.group}`, value: '', complete: group.every(entryComplete) }] : []),
    ...added.map((e) => row(e, 'a')),
  ]
}
