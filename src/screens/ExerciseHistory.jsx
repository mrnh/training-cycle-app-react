import { useState } from 'react'
import CommentIcon from '../components/CommentIcon'
import Sheet from '../components/Sheet'
import useConfirm from '../components/useConfirm'
import { GROUPS, bestByReps, exerciseHistory, fmt, fmtDate, fmtDateShort, sessionName, setsSummary } from '../program'
import { update } from '../store'
import ScreenHeader from '../components/ScreenHeader'

/** One exercise: name and best weights, every finished session it was done in (newest first), delete. */
export default function ExerciseHistory({ state, ex, onBack, backLabel = 'Back' }) {
  const groups = GROUPS.filter((g) => state.groups[g].some((e) => e.id === ex.id))
  const mainLift = state.cycles.some((c) => c.primaries.includes(ex.id))
  // Main-lift and accessory entries together; only ticked sets count
  const rows = exerciseHistory(state, ex.id) // oldest first
  const best = bestByReps(rows)
  const history = [...rows].reverse() // newest first
  const [comment, setComment] = useState(null) // history row whose comment is shown
  const [renaming, setRenaming] = useState(false)

  const rename = (name) => update((d) => void (d.catalog.find((e) => e.id === ex.id).name = name))
  const [confirmDialog, confirm] = useConfirm()
  async function remove() {
    const ok = await confirm({
      title: `Delete ${ex.name}?`,
      message: 'It disappears from your exercise catalog. Sessions you already finished keep their record of it.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    onBack()
    update((d) => void (d.catalog = d.catalog.filter((e) => e.id !== ex.id)))
  }
  // Sessions finished before dates were recorded fall back to their name
  const when = (h) => (h.date ? fmtDate(h.date) : sessionName(h))

  return (
    <div className="screen">
      <ScreenHeader title="Exercise history" backLabel={backLabel} onBack={onBack} />

      <section className="card">
        <div className="sec-head">
          <h2>{ex.name}</h2>
          <button className="sec-pen" aria-label={`Rename ${ex.name}`} onClick={() => setRenaming(true)}>
            ✎
          </button>
        </div>
        <h3>Personal bests</h3>
        {/* Heaviest ticked set for exactly that many reps, and when; empty = never done */}
        <table className="rm-table">
          <thead>
            <tr>{best.map((_, i) => <th key={i}>{i + 1} RM</th>)}</tr>
          </thead>
          <tbody>
            <tr>
              {best.map((b, i) => (
                <td key={i}>
                  {b && (
                    <>
                      <strong>{fmt(b.w)}</strong>
                      {b.date && <span className="rm-date">{fmtDateShort(b.date)}</span>}
                    </>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
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
                    <CommentIcon filled />
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

      {confirmDialog}
      {renaming && <NameDialog name={ex.name} onSave={rename} onClose={() => setRenaming(false)} />}

      {comment && (
        <CommentView
          title={`${when(comment)} · ${sessionName(comment)}`}
          text={comment.note}
          onClose={() => setComment(null)}
        />
      )}
    </div>
  )
}

/** Read-only view of a comment from a finished session (CommentDialog edits one). */
function CommentView({ title, text, onClose }) {
  return (
    <Sheet onClose={onClose} onSubmit={onClose}>
      <div>
        <h2>Comment</h2>
        <p className="muted small">{title}</p>
      </div>
      <p className="comment-text">{text}</p>
      <div className="button-row end">
        <button type="submit" className="primary">Close</button>
      </div>
    </Sheet>
  )
}

function NameDialog({ name, onSave, onClose }) {
  const [draft, setDraft] = useState(name)
  function save() {
    if (!draft.trim()) return
    onSave(draft.trim())
    onClose()
  }
  return (
    <Sheet onClose={onClose} onSubmit={save} focusInput>
      <h2>Rename exercise</h2>
      <label className="field">
        <span>Name</span>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} />
      </label>
      <div className="button-row end">
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit" className="primary" disabled={!draft.trim()}>Save</button>
      </div>
    </Sheet>
  )
}
