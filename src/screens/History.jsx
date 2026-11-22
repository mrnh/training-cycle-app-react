import { entryComplete, finishedWorkouts, fmtDate, sessionName, setsSummary } from '../program'

/**
 * History tab: every finished workout, newest first, in compact form. Per workout one row per
 * main lift (what was done), one row for the accessory group and one per exercise added during
 * the workout. A row is grey when not every planned set was ticked. Workouts of the current
 * cycle open their finished session when tapped.
 */
export default function History({ state, onOpen }) {
  const workouts = finishedWorkouts(state)
  const current = state.cycles.length - 1

  return (
    <div className="screen">
      <h1>History</h1>
      {workouts.length === 0 && <p className="muted small center">No finished workouts yet.</p>}
      {workouts.map(({ cycle, plan, record }) => {
        const Tag = cycle === current ? 'button' : 'div'
        return (
          <Tag
            key={`${cycle}:${plan.key}`}
            className="card workout"
            {...(cycle === current && { onClick: () => onOpen(plan.key) })}
          >
            <span className="workout-head">
              <strong>{sessionName(plan)}</strong>
              <span className="muted small">
                {record.finishedAt ? fmtDate(record.finishedAt) : ''}
                {cycle !== current && ` · cycle ${cycle + 1}`}
              </span>
            </span>
            <WorkoutRows record={record} />
          </Tag>
        )
      })}
    </div>
  )
}

function WorkoutRows({ record }) {
  const main = record.entries.filter((e) => e.kind === 'main')
  const group = record.entries.filter((e) => e.kind === 'secondary' && !e.added)
  const added = record.entries.filter((e) => e.kind === 'secondary' && e.added)
  const done = (e) => setsSummary(e.sets.filter((s) => s.done)) || 'nothing ticked'

  return (
    <span className="workout-rows">
      {main.map((e) => (
        <Row key={`m-${e.exerciseId}`} name={e.name} value={done(e)} complete={entryComplete(e)} />
      ))}
      {group.length > 0 && <Row name={`Accessory work ${record.group}`} complete={group.every(entryComplete)} />}
      {added.map((e) => (
        <Row key={`a-${e.exerciseId}`} name={e.name} value={done(e)} complete={entryComplete(e)} />
      ))}
    </span>
  )
}

function Row({ name, value, complete }) {
  return (
    <span className={`workout-row ${complete ? '' : 'incomplete'}`}>
      <span>{name}</span>
      {value && <span>{value}</span>}
    </span>
  )
}
