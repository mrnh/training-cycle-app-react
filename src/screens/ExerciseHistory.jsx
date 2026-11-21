import { useEffect, useRef, useState } from 'react'
import { GROUPS, exerciseHistory, fmtDate, sessionName, setsSummary } from '../program'
import { update } from '../store'

/** One exercise: name, every finished session it was done in (newest first), delete. */
export default function ExerciseHistory({ state, ex, onBack }) {
  const groups = GROUPS.filter((g) => state.groups[g].some((e) => e.id === ex.id))
  const mainLift = state.cycles.some((c) => c.primaries.includes(ex.id))
  // Main-lift and accessory entries together, newest first; only ticked sets count
  const history = exerciseHistory(state, ex.id).reverse()
  const [comment, setComment] = useState(null) // history row whose comment is shown

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
        <label className="field">
          <span>Name</span>
          <input
            value={ex.name}
            onChange={(e) => rename(e.target.value)}
            onBlur={(e) => !e.target.value.trim() && rename('Unnamed exercise')}
          />
        </label>
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
