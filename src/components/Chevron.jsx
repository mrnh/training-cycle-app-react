/** "›" marking something that opens another screen (Settings cards, History workouts). */
export default function Chevron({ size = 20 }) {
  return (
    <svg className="chevron" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}
