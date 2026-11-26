import { useEffect, useState } from 'react'
import './App.css'
import UpdatePrompt from './components/UpdatePrompt'
import useEdgeSwipeBack from './useEdgeSwipeBack'
import { activeSession, nextSession, sessionsOf } from './program'
import History from './screens/History'
import Plan from './screens/Plan'
import Session from './screens/Session'
import Settings from './screens/Settings'
import Setup from './screens/Setup'
import { currentCycle, useStore } from './store'

const TABS = [
  { id: 'overview', label: 'Overview', icon: '▦' },
  { id: 'session', label: 'Session', icon: '◉' },
  { id: 'history', label: 'History', icon: '☰' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

/**
 * Keeps the screen from dimming while `on` (a session is in progress), where the browser
 * supports it. The browser drops the lock when the app is hidden, so it is taken again when the
 * app comes back.
 */
function useWakeLock(on) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return
    let lock = null
    let stopped = false
    const acquire = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        lock = await navigator.wakeLock.request('screen')
        if (stopped) lock.release()
      } catch {
        // Not allowed right now (e.g. low battery mode); nothing to do
      }
    }
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', acquire)
      lock?.release().catch(() => {})
    }
  }, [on])
}

export default function App() {
  const state = useStore()
  // Ask the browser to keep this app's data even when storage runs low or it's not used for a while
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {})
  }, [])
  useWakeLock(!!state && state.keepAwake !== false && !!currentCycle(state).active)
  useEdgeSwipeBack(!!state)
  const [tab, setTab] = useState('overview')
  const [selected, setSelected] = useState(null)
  // Bumped on every tab tap, so tapping the open tab returns it to its first screen (Settings sub-screens)
  const [tabTaps, setTabTaps] = useState(0)
  // Where a session was opened from ({ tab, selected, scrollY }), for its back button. Tapping a
  // tab starts over.
  const [backStack, setBackStack] = useState([])

  if (state === undefined) return <div className="screen muted center">Loading…</div>
  if (state === null)
    return (
      <>
        <Setup />
        <UpdatePrompt />
      </>
    )

  const cycle = currentCycle(state)
  // The open session, else the next one to start
  const upcoming = () => (activeSession(cycle) ?? nextSession(cycle))?.key ?? sessionsOf(cycle).at(-1).key
  // Pinned when the tab opens, so ticking the last set doesn't jump to the next session.
  const sessionKey = selected ?? upcoming()
  const openSession = (key) => {
    setBackStack((s) => [...s, { tab, selected: tab === 'session' ? sessionKey : selected, scrollY: window.scrollY }])
    setSelected(key)
    setTab('session')
    window.scrollTo(0, 0)
  }
  // Back to the screen the session was opened from, at the same scroll position
  const goBack = () => {
    const last = backStack.at(-1)
    setBackStack((s) => s.slice(0, -1))
    setSelected(last.selected)
    setTab(last.tab)
    requestAnimationFrame(() => window.scrollTo(0, last.scrollY))
  }
  const switchTab = (id) => {
    setBackStack([])
    // Tapping the Session tab opens the session in progress, or the next one to start.
    if (id === 'session') setSelected(upcoming())
    setTab(id)
    setTabTaps((n) => n + 1)
    window.scrollTo(0, 0)
  }

  return (
    <>
      <main className={tab === 'overview' ? 'fit' : undefined}>
        {tab === 'overview' && <Plan state={state} onOpen={openSession} />}
        {tab === 'session' && <Session
            key={sessionKey}
            state={state}
            sessionKey={sessionKey}
            onBack={backStack.length ? goBack : undefined}
          />}
        {tab === 'history' && <History key={tabTaps} state={state} />}
        {tab === 'settings' && <Settings key={tabTaps} state={state} />}
      </main>
      <UpdatePrompt />
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => switchTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </>
  )
}
