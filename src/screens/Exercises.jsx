import { useState } from 'react'
import { newId } from '../program'
import { update } from '../store'
import ExerciseHistory from './ExerciseHistory'
import ScreenHeader from '../components/ScreenHeader'
import Chevron from '../components/Chevron'
import { t } from '../i18n'

/**
 * The exercise catalog, a sub-screen of Settings (with a field to add exercises). Main lifts and
 * accessory work are picked from it; tapping an exercise opens its history. History's "All
 * exercises" screen is the same list without the field.
 */
export default function Exercises({ state, onBack, title = t('exercises.catalog'), backLabel = t('exercises.backToSettings'), canAdd = true }) {
  // Exercise whose history screen is shown; leaving the tab resets it
  const [detail, setDetail] = useState(null)
  const show = (id) => {
    setDetail(id)
    window.scrollTo(0, 0)
  }

  const ex = state.catalog.find((e) => e.id === detail)
  if (ex) return <ExerciseHistory state={state} ex={ex} backLabel={canAdd ? t('exercises.backToCatalog') : t('exercises.backToAll')} onBack={() => show(null)} />

  return (
    <div className="screen">
      <ScreenHeader title={title} backLabel={backLabel} onBack={onBack} />
      {canAdd && <AddExercise />}
      <div className="card list">
        {state.catalog.map((e) => (
          <div key={e.id}>
            <button className="list-row" onClick={() => show(e.id)}>
              <span>{e.name}</span>
              <Chevron size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AddExercise() {
  const [name, setName] = useState('')
  function add(e) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    update((d) => void d.catalog.push({ id: newId(), name: n }))
    setName('')
  }
  return (
    <form className="add-row" onSubmit={add}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('exercises.new')} aria-label={t('exercises.name')} />
      <button className="primary" type="submit">{t('common.add')}</button>
    </form>
  )
}
