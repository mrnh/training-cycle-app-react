import NumInput from './NumInput'

/**
 * One set: weight, reps, tick. `weight`/`reps` are the values shown in the fields;
 * `hintW`/`hintR` are shown as placeholders when the field is empty.
 */
export default function SetRow({ index, label, weight, reps, hintW, hintR, done, onChange, onToggle }) {
  return (
    <div className={`set-row ${done ? 'is-done' : ''}`}>
      <span className="set-no">{label ?? index + 1}</span>
      <NumInput value={weight} placeholder={hintW} label={`Set ${index + 1} weight`} onChange={(w) => onChange({ w })} />
      <NumInput value={reps} placeholder={hintR} label={`Set ${index + 1} reps`} onChange={(r) => onChange({ r })} />
      <button
        className="tick"
        aria-label={done ? `Untick set ${index + 1}` : `Tick set ${index + 1}`}
        aria-pressed={done}
        onClick={onToggle}
      >
        ✓
      </button>
    </div>
  )
}

export function SetHeader() {
  return (
    <div className="set-row set-head">
      <span>Set</span>
      <span>kg</span>
      <span>Reps</span>
      <span />
    </div>
  )
}
