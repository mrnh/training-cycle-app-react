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

  if (state === undefined) return <div className="screen muted center">Loading…</div>
  if (state === null) return <Setup />

  const cycle = currentCycle(state)
  // The open session, else the next one to start
  const upcoming = () => (activeSession(cycle) ?? nextSession(cycle))?.key ?? ALL_SESSIONS.at(-1).key
  // Pinned when the tab opens, so ticking the last set doesn't jump to the next session.
  const sessionKey = selected ?? upcoming()
  const openSession = (key) => {
    setSelected(key)
    setTab('session')
    window.scrollTo(0, 0)
  }
  const switchTab = (id) => {
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
        {tab === 'session' && <Session key={sessionKey} state={state} sessionKey={sessionKey} onNavigate={openSession} />}
        {tab === 'history' && <History />}
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
