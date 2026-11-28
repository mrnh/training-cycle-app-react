/** Two or more mutually exclusive options as one row of buttons. */
export default function Segmented({ label, options, value, onChange }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          aria-label={o.name}
          className={[value === o.id && 'active', o.flag && 'flag'].filter(Boolean).join(' ') || undefined}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
