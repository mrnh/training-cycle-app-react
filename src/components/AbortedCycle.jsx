import { useState } from 'react'
import StartCycle from './StartCycle'
import { fmtDate } from '../program'
import { currentCycle } from '../store'
import { t } from '../i18n'

/** Overview and Session tabs while the current cycle is aborted: nothing to train until a new one starts. */
export default function AbortedCycle({ state }) {
  const cycle = currentCycle(state)
  const [open, setOpen] = useState(false)
  if (open) return <StartCycle state={state} onClose={() => setOpen(false)} />
  return (
    <div className="screen">
      <div className="card highlight">
        <strong>{t('cycleAborted.title')}</strong>
        <p className="muted small">
          {t('cycleAborted.text', { date: fmtDate(cycle.abortedAt) })}
        </p>
        <button className="primary" onClick={() => setOpen(true)}>
          {t('cycleAborted.start')}
        </button>
      </div>
    </div>
  )
}
