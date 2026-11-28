import { PROGRAMS, programFacts, programName } from '../program'
import { t } from '../i18n'

/**
 * The programs to choose from: one card with a radio button per program, each with its name and
 * what it looks like at a glance. `value` is the chosen program's id. Used by the setup screen;
 * meant for starting later cycles too.
 */
export default function ProgramPicker({ value, onChange }) {
  return (
    <fieldset className="card program-card">
      <legend className="sr-only">{t('program.pick')}</legend>
      {PROGRAMS.map((p) => (
        <label key={p.id} className="program-option">
          <input type="radio" name="program" value={p.id} checked={value === p.id} onChange={() => onChange(p.id)} />
          <span>
            <strong>{programName(p)}</strong>
            <span className="program-facts muted small">
              {programFacts(p).map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}
