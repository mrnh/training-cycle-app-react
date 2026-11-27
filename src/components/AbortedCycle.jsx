import { useState } from 'react'
import NewCycleDialog from './NewCycleDialog'
import { fmtDate } from '../program'
import { currentCycle } from '../store'

/** Overview and Session tabs while the current cycle is aborted: nothing to train until a new one starts. */
export default function AbortedCycle({ state }) {
  const cycle = currentCycle(state)
  const [open, setOpen] = useState(false)
  return (
    <div className="screen">
      <div className="card highlight">
        <strong>Cycle aborted</strong>
        <p className="muted small">
          This cycle ended on {fmtDate(cycle.abortedAt)}. Everything you finished stays in History.
        </p>
        <button className="primary" onClick={() => setOpen(true)}>
          Start a new cycle
        </button>
      </div>
      {open && <NewCycleDialog state={state} onClose={() => setOpen(false)} />}
    </div>
  )
}
