import Sheet from './Sheet'

/**
 * Confirms finishing a session; lists main-lift sets that weren't ticked. Also used when
 * starting the next session finishes the open one (heading, message and button differ).
 */
export default function FinishDialog({
  unticked, onConfirm, onClose, heading = 'Finish session?', message, confirmLabel = 'Finish session',
}) {
  function confirm() {
    onConfirm()
    onClose()
  }

  return (
    <Sheet onClose={onClose} onSubmit={confirm}>
      <h2>{heading}</h2>
      <p className="small">{message ?? 'Marking this session as finished prevents it from being changed afterwards. Do you want to proceed?'}</p>
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
        <button type="submit" className="primary">{confirmLabel}</button>
      </div>
    </Sheet>
  )
}
