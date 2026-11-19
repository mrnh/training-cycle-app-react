import { useState } from 'react'
import './App.css'
import { ALL_SESSIONS, nextSession } from './program'
import Exercises from './screens/Exercises'
import Plan from './screens/Plan'
import Session from './screens/Session'
import Settings from './screens/Settings'
import Setup from './screens/Setup'
import { currentCycle, useStore } from './store'

const TABS = [
  { id: 'plan', label: 'Plan', icon: '▦' },
  { id: 'session', label: 'Session', icon: '◉' },
  { id: 'exercises', label: 'Exercises', icon: '☰' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export default function App() {
  const state = useStore()
  const [tab, setTab] = useState('plan')
  const [selected, setSelected] = useState(null)

  if (state === undefined) return <div className="screen muted center">Loading…</div>
  if (state === null) return <Setup />

  const cycle = currentCycle(state)
  const upcoming = () => nextSession(cycle)?.key ?? ALL_SESSIONS.at(-1).key
  // Pinned when the tab opens, so ticking the last set doesn't jump to the next session.
  const sessionKey = selected ?? upcoming()
  const openSession = (key) => {
    setSelected(key)
    setTab('session')
    window.scrollTo(0, 0)
  }
  const switchTab = (id) => {
    // Tapping the Session tab opens the next open session.
    if (id === 'session') setSelected(upcoming())
    setTab(id)
    window.scrollTo(0, 0)
  }

  return (
    <>
      <main className={tab === 'plan' ? 'fit' : undefined}>
        {tab === 'plan' && <Plan state={state} onOpen={openSession} />}
        {tab === 'session' && <Session state={state} sessionKey={sessionKey} onNavigate={openSession} />}
        {tab === 'exercises' && <Exercises state={state} />}
        {tab === 'settings' && <Settings state={state} />}
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
