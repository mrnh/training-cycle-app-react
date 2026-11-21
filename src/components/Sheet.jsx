import { useEffect, useRef } from 'react'

/**
 * A modal dialog with a form inside, used by every dialog in the app. Escape and a tap on the
 * backdrop call `onClose` (nothing is saved); submitting the form calls `onSubmit`, which saves
 * and closes itself. `focusInput` puts the cursor in the first field so the keyboard opens.
 */
export default function Sheet({ onClose, onSubmit, focusInput = false, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const d = ref.current
    d.showModal()
    if (focusInput) d.querySelector('input')?.focus()
    return () => d.open && d.close()
  }, [focusInput])

  return (
    <dialog ref={ref} className="sheet" onCancel={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        {children}
      </form>
    </dialog>
  )
}
