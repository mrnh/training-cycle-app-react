import CycleSetup from './CycleSetup'
import { activeSession, emptyLifts, finishSession, heaviestWeight, isoDay, programOf } from '../program'
import { currentCycle, newCycle, update } from '../store'
import { t } from '../i18n'

/**
 * Starts a later cycle: the same setup as the first start, with the current cycle's program and
 * options chosen. For the same program the lifts and numbers carry over (`numbers` = { lift id:
 * number } replaces the cycle's own, e.g. the suggestions after a finished cycle); another program
 * starts empty. The current cycle stays in the history, and an open session is finished as it is.
 */
export default function StartCycle({ state, numbers, onClose }) {
  const cycle = currentCycle(state)
  const program = programOf(cycle)
  const lifts = cycle.primaries.map((id) => ({ id: id ?? '', rm: id ? (numbers?.[id] ?? cycle.oneRM[id] ?? null) : null }))

  function start({ startDate, oneRM, primaries, programId, options }) {
    update((d) => {
      const old = currentCycle(d)
      const open = activeSession(old)
      if (open) finishSession(d, old, open, isoDay(new Date()))
      old.timer = null
      d.cycles.push(newCycle(startDate, oneRM, primaries, programId, options))
    })
    onClose()
  }

  return (
    <CycleSetup
      title={t('newCycle.title')}
      chooseText={t('setup.chooseNext')}
      defaults={{ programId: program.id, options: program.chosen }}
      liftsFor={(p) => (p.id === program.id ? lifts : emptyLifts(p))}
      catalog={state.catalog}
      prefill={(id) => heaviestWeight(state, id)}
      openSession={activeSession(cycle)}
      onBack={onClose}
      onStart={start}
    />
  )
}
