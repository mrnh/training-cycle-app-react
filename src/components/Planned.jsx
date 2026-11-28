import { fmt, unit } from '../program'

/**
 * The planned work of an exercise card: "6×4 @ 80 kg", the weight in bold. Sets that differ
 * (perSet: [{ w, r, plus }]) read "5 / 5 / 5+ @ 82 / 95 / 107 kg".
 */
export default function Planned({ sets, reps, weight, perSet }) {
  if (perSet)
    return (
      <p className="muted small">
        {perSet.map((s) => `${s.r}${s.plus ? '+' : ''}`).join(' / ')} @{' '}
        <strong className="planned">{perSet.map((s) => fmt(s.w)).join(' / ')} {unit()}</strong>
      </p>
    )
  return (
    <p className="muted small">
      {sets}×{reps} @ <strong className="planned">{fmt(weight)} {unit()}</strong>
    </p>
  )
}
