import { useState } from 'react'
import NumInput from './NumInput'
import Sheet from './Sheet'
import { MAX_SETS, unit } from '../program'
import { t } from '../i18n'

/**
 * Edit weight and reps of all sets of a secondary exercise at once, and add or remove sets.
 * `rows` are the logged values ({ w, r }, null = not entered); `hints` are what an empty field
 * stands for (the prescription). Nothing is saved until "Save". With `onRemove` (exercises added
 * for this session only) it also offers removing the exercise.
 */
export default function SetsDialog({ title, planned, rows, hints, onSave, onRemove, onClose }) {
  const [draft, setDraft] = useState(rows)

  const setRow = (i, patch) => setDraft(draft.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const hint = (i) => hints[i] ?? hints.at(-1) ?? {}

  function save() {
    onSave(draft)
    onClose()
  }

  return (
    <Sheet onClose={onClose} onSubmit={save}>
      <h2>{title}</h2>
      {planned && <p className="muted small">{t('sets.planned', { text: planned })}</p>}
      <div className="sets-edit">
        <span className="set-head">{t('sets.set')}</span>
        <span className="set-head">{unit()}</span>
        <span className="set-head">{t('sets.reps')}</span>
        {draft.map((x, i) => (
          <div key={i} className="sets-edit-row">
            <span className="set-no">{i + 1}</span>
            <NumInput value={x.w} placeholder={hint(i).w} label={t('sets.weightOf', { n: i + 1 })} onChange={(w) => setRow(i, { w })} />
            <NumInput value={x.r} placeholder={hint(i).r} label={t('sets.repsOf', { n: i + 1 })} onChange={(r) => setRow(i, { r })} />
          </div>
        ))}
      </div>
      <div className="row">
        <button type="button" className="small-btn" disabled={draft.length <= 1} onClick={() => setDraft(draft.slice(0, -1))}>
          {t('sets.removeSet')}
        </button>
        <button type="button" className="small-btn" disabled={draft.length >= MAX_SETS} onClick={() => setDraft([...draft, { w: null, r: null }])}>
          {t('sets.addSet')}
        </button>
      </div>
      <div className="button-row end">
        {onRemove && (
          <button type="button" className="remove-exercise" onClick={onRemove}>
            {t('common.removeExercise')}
          </button>
        )}
        <button type="button" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="primary">{t('common.save')}</button>
      </div>
    </Sheet>
  )
}
