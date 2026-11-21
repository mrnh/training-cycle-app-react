import { fmt, unit } from '../program'

/** The planned work of an exercise card: "6×4 @ 80 kg", the weight in bold. */
export default function Planned({ sets, reps, weight }) {
  return (
    <p className="muted small">
      {sets}×{reps} @ <strong className="planned">{fmt(weight)} {unit()}</strong>
    </p>
  )
}
