/** History of one exercise. Placeholder for now: title and a way back. */
export default function ExerciseHistory({ name, onBack }) {
  return (
    <div className="screen">
      <header className="session-head">
        <button className="icon" aria-label="Back to exercises" onClick={onBack}>
          ‹
        </button>
        <div>
          <h1>Exercise history</h1>
          <p className="muted small">{name}</p>
        </div>
        <span className="icon-spacer" />
      </header>
    </div>
  )
}
