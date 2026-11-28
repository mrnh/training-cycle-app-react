import { useState } from 'react'
import MainLiftFields from '../components/MainLiftFields'
import ProgramPicker from '../components/ProgramPicker'
import ScreenHeader from '../components/ScreenHeader'
import { DEFAULT_CATALOG, DEFAULT_PROGRAM, mainLiftsError, programById, programName, sessionsPerWeekText, todayIso } from '../program'
import { initialState, replaceState } from '../store'
import { t } from '../i18n'

/**
 * First start, in two steps: choose a program, then the start date and the main lifts with their
 * 1RMs (one row per lift the program uses).
 */
export default function Setup() {
  const [step, setStep] = useState('program') // 'program' | 'details'
  const [programId, setProgramId] = useState(DEFAULT_PROGRAM.id)
  const program = programById(programId)
  const [startDate, setStartDate] = useState(todayIso())
  // Lift rows of the chosen program: [{ id, rm }] per main-lift slot, reset when another program is chosen
  const [lifts, setLifts] = useState(() => DEFAULT_PROGRAM.defaultLifts.map((id) => ({ id, rm: null })))
  const [error, setError] = useState('')

  const choose = (id) => {
    if (id !== programId) setLifts(programById(id).defaultLifts.map((lift) => ({ id: lift, rm: null })))
    setProgramId(id)
  }

  function start(e) {
    e.preventDefault()
    if (!startDate) return setError(t('newCycle.pickDate'))
    const liftError = mainLiftsError(lifts)
    if (liftError) return setError(liftError)
    const oneRM = Object.fromEntries(lifts.filter((l) => l.id).map((l) => [l.id, l.rm]))
    replaceState(initialState(startDate, oneRM, lifts.map((l) => l.id || null), program.id))
  }

  if (step === 'program')
    return (
      <div className="screen setup">
        <h1>{t('setup.title')}</h1>
        <p className="muted">{t('setup.choose')}</p>
        <ProgramPicker value={programId} onChange={choose} />
        <button className="primary" onClick={() => setStep('details')}>
          {t('setup.continue')}
        </button>
      </div>
    )

  return (
    <form className="screen setup" onSubmit={start}>
      <ScreenHeader title={programName(program)} onBack={() => setStep('program')} backLabel={t('setup.backToPrograms')} />
      <p className="muted">
        {t('setup.intro', { weeks: program.weekCount, perWeek: sessionsPerWeekText(program).text })}
      </p>

      <label className="field">
        <span>{t('newCycle.startDate')}</span>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </label>

      <div className="field">
        <span>{t('newCycle.lifts')}</span>
        <MainLiftFields
          rows={lifts}
          catalog={DEFAULT_CATALOG}
          onChange={(rows) => {
            setError('')
            setLifts(rows)
          }}
        />
      </div>

      {error && <p className="error">{error}</p>}
      <button className="primary" type="submit">
        {t('newCycle.start')}
      </button>
    </form>
  )
}
