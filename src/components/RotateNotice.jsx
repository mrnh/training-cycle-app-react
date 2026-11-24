/**
 * Shown instead of the app when a phone is held sideways and Settings → Screen-rotate is Off.
 * An installed web app can't lock its orientation on iPhone, so the app steps aside instead; the
 * stylesheet shows this only on landscape phone screens (see `.rotate-notice`).
 */
export default function RotateNotice() {
  return (
    <div className="rotate-notice" role="alert">
      <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="3" width="10" height="18" rx="2" />
        <path d="M11 18h2" />
      </svg>
      <strong>Turn your phone upright</strong>
      <span className="muted small">Screen-rotate is off. You can turn it on under Settings → Preferences.</span>
    </div>
  )
}
