import { fmt, fmtDate, setText } from '../program'

/** A finished session, read-only, shown from its permanent record. */
export default function FinishedSession({ record }) {
  return (
    <>
      <p className="finished-banner small">
        ✓ Finished{record.finishedAt ? ` on ${fmtDate(record.finishedAt)}` : ''}
      </p>

      {record.entries.map((e) =>
        e.kind === 'main' ? <MainEntry key={`m-${e.exerciseId}`} e={e} /> : <SecondaryEntry key={`s-${e.exerciseId}`} e={e} />,
      )}

      {record.note && (
        <section className="card">
          <h2>Session note</h2>
          <p className="note-text">{record.note}</p>
        </section>
      )}
    </>
  )
}

function MainEntry({ e }) {
  return (
    <section className="card">
      <div className="lift-head">
        <div>
          <h2>{e.name}</h2>
          <p className="muted small">
            {e.sets}×{e.reps} @ {e.pct}% · <strong className="planned">{fmt(e.planned)} kg</strong>
          </p>
        </div>
        <div className="weight-used">
          <span>Weight used</span>
          <span className="weight-value">
            <strong className={e.weight !== e.planned ? 'changed' : undefined}>{fmt(e.weight)} kg</strong>
          </span>
        </div>
      </div>
      <div className="set-toggles" role="list">
        {e.done.map((d, i) => (
          <span key={i} role="listitem" className={`set-toggle static ${d ? 'is-done' : ''}`} aria-label={`Set ${i + 1}${d ? ', done' : ', not done'}`}>
            {i + 1}
          </span>
        ))}
      </div>
      {e.note && <p className="note-text">{e.note}</p>}
    </section>
  )
}

function SecondaryEntry({ e }) {
  return (
    <section className="card">
      <h2>{e.name}</h2>
      {e.prescription && (
        <p className="muted small">
          {e.prescription.sets}×{e.prescription.reps} @ <strong className="planned">{fmt(e.prescription.weight)} kg</strong>
        </p>
      )}
      {e.sets.length === 0 ? (
        <p className="muted small">No sets logged</p>
      ) : (
        <ol className="done-sets">
          {e.sets.map((x, i) => (
            <li key={i} className={x.done ? 'is-done' : 'muted'}>
              <span className="set-no">{i + 1}</span>
              <span>{setText(x)}</span>
              <span aria-label={x.done ? 'done' : 'not done'}>{x.done ? '✓' : ''}</span>
            </li>
          ))}
        </ol>
      )}
      {e.note && <p className="note-text">{e.note}</p>}
    </section>
  )
}
