import { useState } from 'react'
import { t } from '../i18n'

/** Comment field that stays collapsed until used. */
export default function Note({ value, onChange, label = t('common.comment') }) {
  const [open, setOpen] = useState(false)
  if (!open && !value) {
    return (
      <button className="link" onClick={() => setOpen(true)}>
        + {label}
      </button>
    )
  }
  return (
    <textarea
      className="note"
      rows={2}
      autoFocus={open && !value}
      placeholder={label}
      aria-label={label}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
