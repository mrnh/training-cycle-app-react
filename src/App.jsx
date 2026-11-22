import { useState } from 'react'
import './App.css'
import { ALL_SESSIONS, activeSession, nextSession } from './program'
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

export default function App() {
  const state = useStore()
  const [tab, setTab] = useState('overview')
  const [selected, setSelected] = useState(null)
  // Bumped on every tab tap, so tapping the open tab returns it to its first screen (Settings sub-screens)
  const [tabTaps, setTabTaps] = useState(0)
  // Where a session was opened from ({ tab, selected, scrollY }), for its back button. Tapping a
  // tab starts over.
  const [backStack, setBackStack] = useState([])

  if (state === undefined) return <div className="screen muted center">Loading…</div>
  if (state === null) return <Setup />

  const cycle = currentCycle(state)
  // The open session, else the next one to start
  const upcoming = () => (activeSession(cycle) ?? nextSession(cycle))?.key ?? ALL_SESSIONS.at(-1).key
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
            onNavigate={openSession}
            onBack={backStack.length ? goBack : undefined}
          />}
        {tab === 'history' && <History state={state} onOpen={openSession} />}
        {tab === 'settings' && <Settings key={tabTaps} state={state} />}
      </main>
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
