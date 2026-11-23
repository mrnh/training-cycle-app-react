import { useRegisterSW } from 'virtual:pwa-register/react'

// How often an open app looks for a new version (it also checks on every start)
const CHECK_EVERY = 60 * 60 * 1000

/**
 * Registers the service worker (the offline copy of the app) and shows a bar above the tab bar
 * when a new version has been downloaded. The new version only takes over after "Reload", so
 * nothing changes in the middle of a workout. Does nothing on the dev server.
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

  if (!needRefresh) return null
  return (
    <div className="update-bar" role="status">
      <span>New version available</span>
      <span className="update-actions">
        <button className="small-btn" onClick={() => setNeedRefresh(false)}>
          Later
        </button>
        <button className="small-btn primary" onClick={() => updateServiceWorker()}>
          Reload
        </button>
      </span>
    </div>
  )
}
