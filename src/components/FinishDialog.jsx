import { useEffect, useRef } from 'react'

/** Confirms finishing a session; lists main-lift sets that weren't ticked. */
export default function FinishDialog({ title, unticked, onConfirm, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const d = ref.current
    d.showModal()
    return () => d.open && d.close()
  }, [])

  function confirm(e) {
    e.preventDefault()
    onConfirm()
    onClose()
  }

  return (
    // Escape / backdrop "cancel" closes without finishing
    <dialog ref={ref} className="sheet" onCancel={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <form onSubmit={confirm}>
        <h2>Finish session?</h2>
        <p className="small">
          {title} is saved permanently and can't be changed afterwards.
        </p>
        {unticked.length > 0 && (
          <div className="warning small">
            {unticked.map((u) => (
              <p key={u.id}>
                {u.missing} of {u.total} {u.name.toLowerCase()} {u.total === 1 ? 'set' : 'sets'} not ticked
              </p>
            ))}
          </div>
        )}
        <div className="button-row end">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary">Finish session</button>
        </div>
      </form>
    </dialog>
  )
}
