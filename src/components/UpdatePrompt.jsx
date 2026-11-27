import { Fragment, useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import Sheet from './Sheet'
import { t } from '../i18n'

// How often an open app looks for a new version (it also checks on every start)
const CHECK_EVERY = 60 * 60 * 1000

/**
 * What the waiting version brings, from its release.json (written at build time from the newest
 * CHANGELOG entry). A release: { version, title, sections }. The same version number as the
 * running app, or no entry for the new number yet: null, i.e. "small improvements".
 */
async function fetchRelease() {
  try {
    // The query string keeps the offline copy (and the browser cache) out of the way
    const res = await fetch(`${import.meta.env.BASE_URL}release.json?t=${Date.now()}`, { cache: 'no-store' })
    const { version, notes } = await res.json()
    return version !== __APP_VERSION__ && notes?.version === version ? notes : null
  } catch {
    return null
  }
}

/**
 * Registers the service worker (the offline copy of the app) and shows a bar above the tab bar
 * when a new version has been downloaded: its number and release title with "What's new" (the
 * full CHANGELOG entry), or "Small improvements" for an update without a new version number.
 * The new version only takes over after "Reload", so nothing changes in the middle of a workout.
 * Does nothing on the dev server.
 */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => registration.update(), CHECK_EVERY)
    },
  })
  const [release, setRelease] = useState(undefined) // undefined = not known yet
  const [showNotes, setShowNotes] = useState(false)

  useEffect(() => {
    if (needRefresh) fetchRelease().then(setRelease)
  }, [needRefresh])

  if (!needRefresh) return null
  return (
    <>
      <div className="update-bar" role="status">
        <span className="update-text">
          <span>{release ? t('update.newVersion', { version: release.version }) : t('update.available')}</span>
          {release === null && <span className="update-detail">{t('update.small')}</span>}
          {release && (
            <span className="update-detail">
              {release.title} ·{' '}
              <button className="link inline" onClick={() => setShowNotes(true)}>
                {t('update.whatsNew')}
              </button>
            </span>
          )}
        </span>
        <span className="update-actions">
          <button className="small-btn" onClick={() => setNeedRefresh(false)}>
            {t('update.later')}
          </button>
          <button className="small-btn primary" onClick={() => updateServiceWorker()}>
            {t('update.reload')}
          </button>
        </span>
      </div>
      {showNotes && <WhatsNew release={release} onReload={() => updateServiceWorker()} onClose={() => setShowNotes(false)} />}
    </>
  )
}

/** The full CHANGELOG entry of the waiting version. */
function WhatsNew({ release, onReload, onClose }) {
  return (
    <Sheet onClose={onClose} onSubmit={onReload}>
      <div>
        <h2>{t('update.whatsNewIn', { version: release.version })}</h2>
        <p className="muted small">{release.title}</p>
      </div>
      {release.sections.map((s) => (
        <div key={s.heading} className="whats-new">
          <h3>{s.heading}</h3>
          <ul>
            {s.items.map((item, i) => (
              <li key={i}>
                <Bold text={item} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="button-row end">
        <button type="button" onClick={onClose}>{t('update.later')}</button>
        <button type="submit" className="primary">{t('update.reload')}</button>
      </div>
    </Sheet>
  )
}

/** Text with **bold** parts, as in the CHANGELOG. */
function Bold({ text }) {
  return text.split('**').map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>))
}
