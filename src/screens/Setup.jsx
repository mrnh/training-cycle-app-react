import { useState } from 'react'
import MainLiftFields from '../components/MainLiftFields'
import ProgramPicker from '../components/ProgramPicker'
import ScreenHeader from '../components/ScreenHeader'
import Segmented from '../components/Segmented'
import { DEFAULT_CATALOG, DEFAULT_PROGRAM, basisOf, mainLiftsError, programById, programName, sessionsPerWeekText, todayIso } from '../program'
import { initialState, replaceState } from '../store'
import { t } from '../i18n'

/**
 * First start, in two steps: choose a program, then its options (if it has any), the start date
 * and the main lifts with their 1RMs (one row per lift the program uses).
 */
export default function Setup() {
  const [step, setStep] = useState('program') // 'program' | 'details'
  const [programId, setProgramId] = useState(DEFAULT_PROGRAM.id)
  const [options, setOptions] = useState(DEFAULT_PROGRAM.defaults) // the program's options, e.g. training days
  const chosen = programById(programId)
  const program = chosen.variant(options) // the plan for those options
  const [startDate, setStartDate] = useState(todayIso())
  // Lift rows of the chosen program: [{ id, rm }] per main-lift slot, reset when another program is chosen
  const [lifts, setLifts] = useState(() => DEFAULT_PROGRAM.defaultLifts.map((id) => ({ id, rm: null })))
  const [error, setError] = useState('')

  const choose = (id) => {
    if (id !== programId) {
      setLifts(programById(id).defaultLifts.map((lift) => ({ id: lift, rm: null })))
      setOptions(programById(id).defaults)
    }
    setProgramId(id)
  }

  function start(e) {
    e.preventDefault()
    if (!startDate) return setError(t('newCycle.pickDate'))
    const liftError = mainLiftsError(lifts)
    if (liftError) return setError(liftError)
    const oneRM = Object.fromEntries(lifts.filter((l) => l.id).map((l) => [l.id, l.rm]))
    replaceState(initialState(startDate, oneRM, lifts.map((l) => l.id || null), program.id, Object.keys(chosen.options).length ? options : undefined))
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
        {t(`programs.${program.id}.intro`, { weeks: program.weekCount, perWeek: sessionsPerWeekText(program).text })}
      </p>

      {Object.entries(chosen.options).map(([name, o]) => (
        <div className="field" key={name}>
          <span>{t(`programs.${program.id}.options.${name}`)}</span>
          <Segmented
            label={t(`programs.${program.id}.options.${name}`)}
            options={o.values.map((v) => ({ id: String(v), label: t(`programs.${program.id}.optionValues.${name}.${v}`) }))}
            value={String(options[name])}
            onChange={(v) => setOptions({ ...options, [name]: o.values.find((x) => String(x) === v) })}
          />
        </div>
      ))}

      <label className="field">
        <span>{t('newCycle.startDate')}</span>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </label>

      <div className="field">
        <span>{t(`newCycle.lifts_${basisOf(program)}`)}</span>
        <MainLiftFields
          basis={basisOf(program)}
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
