import { useState } from 'react'
import Sheet from './Sheet'

/**
 * In-app replacement for the browser's confirm(), which some browsers and embedded views block
 * (it then returns false at once and nothing happens). Usage:
 *   const [confirmDialog, confirm] = useConfirm()
 *   if (!(await confirm({ title, message, confirmLabel, danger }))) return
 * and render {confirmDialog} somewhere in the component.
 */
export default function useConfirm() {
  const [ask, setAsk] = useState(null) // { title, message, confirmLabel, danger, resolve }
  const confirm = (options) => new Promise((resolve) => setAsk({ ...options, resolve }))
  const answer = (result) => {
    ask.resolve(result)
    setAsk(null)
  }
  const dialog = ask && (
    <Sheet onClose={() => answer(false)} onSubmit={() => answer(true)}>
      <h2>{ask.title}</h2>
      {ask.message && <p className="small">{ask.message}</p>}
      <div className="button-row end">
        <button type="button" onClick={() => answer(false)}>Cancel</button>
        <button type="submit" className={ask.danger ? 'danger' : 'primary'}>{ask.confirmLabel ?? 'OK'}</button>
      </div>
    </Sheet>
  )
  return [dialog, confirm]
}
