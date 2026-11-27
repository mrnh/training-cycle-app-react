import { useState } from 'react'
import MainLiftFields from '../components/MainLiftFields'
import { DEFAULT_CATALOG, DEFAULT_PRIMARIES, DEFAULT_PROGRAM, mainLiftsError, todayIso } from '../program'
import { initialState, replaceState } from '../store'
import { t } from '../i18n'

export default function Setup() {
  const [startDate, setStartDate] = useState(todayIso())
  const [lifts, setLifts] = useState(DEFAULT_PRIMARIES.map((id) => ({ id, rm: null }))) // per main-lift slot
  const [error, setError] = useState('')

  function start(e) {
    e.preventDefault()
    if (!startDate) return setError(t('newCycle.pickDate'))
    const liftError = mainLiftsError(lifts)
    if (liftError) return setError(liftError)
    const oneRM = Object.fromEntries(lifts.filter((l) => l.id).map((l) => [l.id, l.rm]))
    replaceState(initialState(startDate, oneRM, lifts.map((l) => l.id || null)))
  }

  return (
    <form className="screen setup" onSubmit={start}>
      <h1>{t('setup.title')}</h1>
      <p className="muted">{t('setup.intro', { weeks: DEFAULT_PROGRAM.weekCount, perWeek: DEFAULT_PROGRAM.weeks[0].length })}</p>

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
