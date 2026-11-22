import { entryAsPrescribed, finishedWorkouts, fmtDateShort } from '../program'

/**
 * History tab: every finished workout, newest first, as one table. Date and session span the
 * workout's rows; then one row per main lift, one for the accessory group and one per exercise
 * added during the workout, each with a check: green when done as prescribed, grey otherwise.
 * Sets and weights are on the finished session, which opens when a workout of the current
 * cycle is tapped.
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
                <th>
                  <span className="sr-only">Done as prescribed</span>
                </th>
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
