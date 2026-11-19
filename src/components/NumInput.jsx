import { useState } from 'react'

/** Numeric field that accepts "82,5" or "82.5" and saves on every keystroke. */
export default function NumInput({ value, onChange, placeholder, label, className = '' }) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const asText = value == null ? '' : String(value)

  return (
    <input
      className={`num ${className}`}
      inputMode="decimal"
      value={focused ? text : asText}
      placeholder={placeholder == null ? '' : String(placeholder)}
      aria-label={label}
      onFocus={(e) => {
        setText(asText)
        setFocused(true)
        e.target.select()
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const t = e.target.value.replace(',', '.')
        if (!/^\d*\.?\d*$/.test(t)) return
        setText(t)
        const n = parseFloat(t)
        onChange(t === '' || isNaN(n) ? null : n)
      }}
    />
  )
}
