import { PROGRAMS, programFacts, programName } from '../program'
import { t } from '../i18n'

/**
 * The programs to choose from, one tappable card each: its name and what it looks like at a
 * glance. `value` is the chosen program's id. Used by the setup screen; meant for starting later
 * cycles too.
 */
export default function ProgramPicker({ value, onChange }) {
  return (
    <div className="program-choices" role="radiogroup" aria-label={t('program.pick')}>
      {PROGRAMS.map((p) => (
        <button key={p.id} type="button" className="program-choice" role="radio" aria-checked={value === p.id} onClick={() => onChange(p.id)}>
          <strong>{programName(p)}</strong>
          <span className="program-facts muted small">
            {programFacts(p).map((fact) => (
              <span key={fact}>{fact}</span>
            ))}
          </span>
        </button>
      ))}
    </div>
  )
}
