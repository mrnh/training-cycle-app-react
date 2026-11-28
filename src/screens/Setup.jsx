import CycleSetup from '../components/CycleSetup'
import { DEFAULT_CATALOG, DEFAULT_PROGRAM, emptyLifts } from '../program'
import { initialState, replaceState } from '../store'
import { t } from '../i18n'

/** First start: the setup of a cycle, with every program on offer and no numbers yet. */
export default function Setup() {
  return (
    <CycleSetup
      title={t('setup.title')}
      chooseText={t('setup.choose')}
      defaults={{ programId: DEFAULT_PROGRAM.id, options: DEFAULT_PROGRAM.defaults }}
      liftsFor={emptyLifts}
      catalog={DEFAULT_CATALOG}
      onStart={({ startDate, oneRM, primaries, programId, options }) => replaceState(initialState(startDate, oneRM, primaries, programId, options))}
    />
  )
}
