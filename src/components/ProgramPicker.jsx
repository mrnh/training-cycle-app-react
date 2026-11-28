import { useState } from 'react'
import Sheet from './Sheet'
import { PROGRAMS, programFacts, programName } from '../program'
import { t } from '../i18n'

/**
 * The programs to choose from: one card with a radio button per program, each with its name and
 * what it looks like at a glance, and an info button that opens the program's description.
 * `value` is the chosen program's id. Used by the setup screen; meant for starting later cycles too.
 */
export default function ProgramPicker({ value, onChange }) {
  const [info, setInfo] = useState(null) // program whose description is open
  return (
    <>
      <fieldset className="card program-card">
        <legend className="sr-only">{t('program.pick')}</legend>
        {PROGRAMS.map((p) => (
          <div key={p.id} className="program-option">
            <label>
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
            <button type="button" className="icon-btn program-info" aria-label={t('program.about', { name: programName(p) })} onClick={() => setInfo(p)}>
              <InfoIcon />
            </button>
          </div>
        ))}
      </fieldset>
      {info && (
        <Sheet onClose={() => setInfo(null)} onSubmit={() => setInfo(null)}>
          <div>
            <h2>{programName(info)}</h2>
            <p className="muted small">{programFacts(info).join(' · ')}</p>
          </div>
          {/* A <br> in the text starts a new paragraph */}
          {t(`programs.${info.id}.description`)
            .split(/<br\s*\/?>/)
            .map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          <div className="button-row end">
            <button type="submit" className="primary">{t('common.close')}</button>
          </div>
        </Sheet>
      )}
    </>
  )
}

/** Circled "i". */
function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r="0.6" fill="currentColor" />
    </svg>
  )
}
