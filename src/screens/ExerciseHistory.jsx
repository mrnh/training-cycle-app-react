import { GROUPS } from '../program'
import { update } from '../store'

/** One exercise. The history itself comes later; for now: title, rename and delete. */
export default function ExerciseHistory({ state, ex, onBack }) {
  const groups = GROUPS.filter((g) => state.groups[g].includes(ex.id))
  const mainLift = state.cycles.some((c) => c.primaries.includes(ex.id))

  const rename = (name) => update((d) => void (d.catalog.find((e) => e.id === ex.id).name = name))
  function remove() {
    if (!confirm(`Delete ${ex.name} from your exercises? Sets you logged stay in your backup.`)) return
    onBack()
    update((d) => void (d.catalog = d.catalog.filter((e) => e.id !== ex.id)))
  }

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
    </div>
  )
}
