import { useState } from 'react'
import MainLiftFields from './MainLiftFields'
import ProgramPicker from './ProgramPicker'
import ScreenHeader from './ScreenHeader'
import Segmented from './Segmented'
import { basisOf, mainLiftsError, programById, programName, sessionName, sessionsPerWeekText, todayIso } from '../program'
import { t } from '../i18n'

/**
 * Starting a cycle, in two steps: choose a program, then its options (if it has any), the start
 * date and the main lifts with their numbers (one row per lift the program uses). Used for the
 * first start and for every later cycle.
 *   title, chooseText  heading and text of the first step
 *   defaults           { programId, options } the program shown as chosen first
 *   liftsFor(program)  the lift rows to start from for a program (previous numbers, or empty)
 *   catalog, prefill   exercises to pick from; prefill(id) suggests a number for a picked lift
 *   openSession        a session still open, which starting finishes as it is (a warning)
 *   onBack             when given, the first step has a back arrow (later cycles)
 *   onStart({ startDate, oneRM, primaries, programId, options })
 */
export default function CycleSetup({ title, chooseText, defaults, liftsFor, catalog, prefill, openSession, onBack, onStart }) {
  const [step, setStep] = useState('program') // 'program' | 'details'
  const [programId, setProgramId] = useState(defaults.programId)
  const [options, setOptions] = useState(defaults.options) // the program's options, e.g. training days
  const chosen = programById(programId)
  const program = chosen.variant(options) // the plan for those options
  const [startDate, setStartDate] = useState(todayIso())
  const [lifts, setLifts] = useState(() => liftsFor(programById(defaults.programId))) // [{ id, rm }] per main-lift slot
  const [error, setError] = useState('')

  const choose = (id) => {
    if (id !== programId) {
      setLifts(liftsFor(programById(id)))
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
    onStart({
      startDate,
      oneRM,
      primaries: lifts.map((l) => l.id || null),
      programId: program.id,
      options: Object.keys(chosen.options).length ? options : undefined,
    })
  }

  if (step === 'program')
    return (
      <div className="screen setup">
        {onBack ? <ScreenHeader title={title} onBack={onBack} /> : <h1>{title}</h1>}
        <p className="muted">{chooseText}</p>
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
      {openSession && <p className="warning small">{t('newCycle.openWarning', { session: sessionName(openSession) })}</p>}

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
          catalog={catalog}
          prefill={prefill}
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
