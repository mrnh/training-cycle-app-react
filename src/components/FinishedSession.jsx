import { useState } from 'react'
import CorrectSession from './CorrectSession'
import Planned from './Planned'
import { fmtDate, setText } from '../program'

/**
 * A finished workout (of any cycle): read-only from its permanent record, with "Correct workout"
 * to fix what was logged wrong (see CorrectSession).
 */
export default function FinishedWorkout({ state, cycleIndex, planKey }) {
  const [correcting, setCorrecting] = useState(false)
  const record = state.cycles[cycleIndex].finished[planKey]
  const done = () => {
    setCorrecting(false)
    window.scrollTo(0, 0)
  }
  if (correcting) return <CorrectSession state={state} cycleIndex={cycleIndex} planKey={planKey} onDone={done} />
  return <FinishedSession record={record} onCorrect={() => setCorrecting(true)} />
}

/** A finished session, read-only, shown from its permanent record. */
function FinishedSession({ record, onCorrect }) {
  return (
    <>
      <p className="finished-banner small">
        ✓ Finished{record.finishedAt ? ` on ${fmtDate(record.finishedAt)}` : ''}
      </p>
      <button className="correct" onClick={onCorrect}>
        Correct workout
      </button>

      {record.entries.map((e) => (
        <Entry key={`${e.kind}-${e.exerciseId}`} e={e} />
      ))}

      {record.note && (
        <section className="card">
          <h2>Session note</h2>
          <p className="note-text">{record.note}</p>
        </section>
      )}
    </>
  )
}

/** One exercise of a finished session (main lift or accessory work): prescription, then each set. */
function Entry({ e }) {
  return (
    <section className={`card ${e.retest ? 'highlight' : ''}`}>
      <h2>{e.name}</h2>
      {e.prescription && <Planned sets={e.prescription.sets} reps={e.prescription.reps} weight={e.prescription.weight} />}
      {e.sets.length === 0 ? (
        // Same row layout as the sets, with a red cross like the History tab
        <ol className="done-sets">
          <li className="muted">
            <span className="set-no" />
            <span>No sets logged</span>
            <span className="not-done" aria-label="not done">
              ✗
            </span>
          </li>
        </ol>
      ) : (
        <ol className="done-sets">
          {e.sets.map((x, i) => (
            <li key={i} className={x.done ? 'is-done' : 'muted'}>
              <span className="set-no">{i + 1}</span>
              <span>{setText(x)}</span>
              <span className={x.done ? undefined : 'not-done'} aria-label={x.done ? 'done' : 'not done'}>
                {x.done ? '✓' : '✗'}
              </span>
            </li>
          ))}
        </ol>
      )}
      {e.note && <p className="note-text">{e.note}</p>}
    </section>
  )
}
