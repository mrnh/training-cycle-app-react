import NumInput from './NumInput'
import { unit } from '../program'
import { t } from '../i18n'

/**
 * The three main-lift slots, each an exercise from the catalog and its 1RM. `rows` is
 * [{ id, rm }] in slot order; id '' = empty slot (its sets are left out of the cycle). An
 * exercise can only be in one slot: options taken by another slot are disabled. `prefill(id)`
 * gives the 1RM suggested when a slot switches exercise.
 */
export default function MainLiftFields({ rows, catalog, onChange, prefill = () => null }) {
  const setRow = (i, patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const taken = (id, i) => rows.some((r, j) => j !== i && r.id === id)

  return (
    <div className="main-lifts">
      {rows.map((r, i) => (
        <div className="main-lift-row" key={i}>
          <select
            aria-label={t('settings.mainLiftN', { n: i + 1 })}
            value={r.id}
            onChange={(e) => setRow(i, { id: e.target.value, rm: e.target.value ? prefill(e.target.value) : null })}
          >
            <option value="" />
            {catalog.map((ex) => (
              <option key={ex.id} value={ex.id} disabled={taken(ex.id, i)}>
                {ex.name}
              </option>
            ))}
          </select>
          <span className="weight-input">
            <NumInput
              value={r.rm}
              placeholder={r.id ? t('settings.rmPlaceholder') : ''}
              label={t('settings.rmForLift', { n: i + 1 })}
              disabled={!r.id}
              onChange={(rm) => setRow(i, { rm })}
            />
            {unit()}
          </span>
        </div>
      ))}
    </div>
  )
}
