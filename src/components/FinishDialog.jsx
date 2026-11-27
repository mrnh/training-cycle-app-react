import Sheet from './Sheet'
import { t } from '../i18n'

/**
 * Confirms finishing a session; lists main-lift sets that weren't ticked. Also used when
 * starting the next session finishes the open one (heading, message and button differ).
 */
export default function FinishDialog({
  unticked, onConfirm, onClose, heading = t('session.finish.heading'), message, confirmLabel = t('session.finish.confirm'),
}) {
  function confirm() {
    onConfirm()
    onClose()
  }

  return (
    <Sheet onClose={onClose} onSubmit={confirm}>
      <h2>{heading}</h2>
      <p className="small">{message ?? t('session.finish.message')}</p>
      {unticked.length > 0 && (
        <div className="warning small">
          {unticked.map((u) => (
            <p key={u.id}>
              {t('session.finish.unticked', { count: u.total, missing: u.missing, total: u.total, name: u.name.toLowerCase() })}
            </p>
          ))}
        </div>
      )}
      <div className="button-row end">
        <button type="button" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="primary">{confirmLabel}</button>
      </div>
    </Sheet>
  )
}
