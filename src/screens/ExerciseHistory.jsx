import { useEffect, useRef, useState } from 'react'
import { GROUPS, bestByReps, exerciseHistory, fmt, fmtDate, sessionName, setsSummary, unit } from '../program'
import { update } from '../store'

/** One exercise: name and best weights, every finished session it was done in (newest first), delete. */
export default function ExerciseHistory({ state, ex, onBack }) {
  const groups = GROUPS.filter((g) => state.groups[g].some((e) => e.id === ex.id))
  const mainLift = state.cycles.some((c) => c.primaries.includes(ex.id))
  // Main-lift and accessory entries together, newest first; only ticked sets count
  const history = exerciseHistory(state, ex.id).reverse()
  const best = bestByReps(history)
  const [comment, setComment] = useState(null) // history row whose comment is shown
  const [renaming, setRenaming] = useState(false)

  const rename = (name) => update((d) => void (d.catalog.find((e) => e.id === ex.id).name = name))
  function remove() {
    if (!confirm(`Delete ${ex.name} from your exercises? Sets you logged stay in your backup.`)) return
    onBack()
    update((d) => void (d.catalog = d.catalog.filter((e) => e.id !== ex.id)))
  }
  // Sessions finished before dates were recorded fall back to their name
  const when = (h) => (h.date ? fmtDate(h.date) : sessionName(h))

  return (
    <div className="screen">
      <header className="session-head">
        <button className="icon" aria-label="Back to exercises" onClick={onBack}>
          ‹
        </button>
        <div>
          <h1>Exercise history</h1>
          <p className="muted small">{ex.name}</p>
        </div>
        <span className="icon-spacer" />
      </header>

      <section className="card">
        <div className="sec-head">
          <h2>{ex.name}</h2>
          <button className="sec-pen" aria-label={`Rename ${ex.name}`} onClick={() => setRenaming(true)}>
            ✎
          </button>
        </div>
        {/* Heaviest ticked set for exactly that many reps; empty = never done */}
        <table className="rm-table">
          <thead>
            <tr>{best.map((_, i) => <th key={i}>{i + 1} RM</th>)}</tr>
          </thead>
          <tbody>
            <tr>{best.map((w, i) => <td key={i}>{w == null ? '' : fmt(w)}</td>)}</tr>
          </tbody>
        </table>
        <p className="muted small">Heaviest set for exactly that many reps, in {unit()}.</p>
      </section>

      <section className="card">
        <h2>History</h2>
        {history.length ? (
          <ul className="history">
            {history.map((h) => (
              <li key={`${h.cycle}:${h.order}:${h.kind}`}>
                <span className="date">{when(h)}</span>
                <span>{setsSummary(h.sets)}</span>
                {h.note ? (
                  <button className="comment-btn" aria-label={`Comment from ${when(h)}`} onClick={() => setComment(h)}>
                    <BubbleIcon />
                  </button>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">Not done in a finished session yet.</p>
        )}
      </section>

      <section className="card">
        {/* Deleting is blocked while the exercise is in use */}
        {mainLift ? (
          <p className="muted small">This is a main lift, so it can't be deleted.</p>
        ) : groups.length ? (
          <p className="muted small">
            Used in group {groups.join(', ')}. Remove it there (Settings) before deleting.
          </p>
        ) : null}
        <button className="danger" onClick={remove} disabled={mainLift || groups.length > 0}>
          Delete exercise
        </button>
      </section>

      {renaming && <NameDialog name={ex.name} onSave={rename} onClose={() => setRenaming(false)} />}

      {comment && (
        <CommentDialog
          title={`${when(comment)} · ${sessionName(comment)}`}
          text={comment.note}
          onClose={() => setComment(null)}
        />
      )}
    </div>
  )
}

function BubbleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5h16v11H9l-5 4z" />
    </svg>
  )
}

function CommentDialog({ title, text, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    d.showModal()
    return () => d.open && d.close()
  }, [])
  return (
    <dialog ref={ref} className="sheet" onCancel={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onClose()
        }}
      >
        <div>
          <h2>Comment</h2>
          <p className="muted small">{title}</p>
        </div>
        <p className="comment-text">{text}</p>
        <div className="button-row end">
          <button type="submit" className="primary">Close</button>
        </div>
      </form>
    </dialog>
  )
}

function NameDialog({ name, onSave, onClose }) {
  const ref = useRef(null)
  const [draft, setDraft] = useState(name)
  useEffect(() => {
    const d = ref.current
    d.showModal()
    return () => d.open && d.close()
  }, [])
  function save(e) {
    e.preventDefault()
    onSave(draft.trim())
    onClose()
  }
  return (
    <dialog ref={ref} className="sheet" onCancel={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <form onSubmit={save}>
        <h2>Rename exercise</h2>
        <label className="field">
          <span>Name</span>
          <input value={draft} autoFocus onChange={(e) => setDraft(e.target.value)} />
        </label>
        <div className="button-row end">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary" disabled={!draft.trim()}>Save</button>
        </div>
      </form>
    </dialog>
  )
}
