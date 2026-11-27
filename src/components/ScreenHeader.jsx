import { t } from '../i18n'
/**
 * Title bar of a screen below a tab: ‹ back (when `onBack` is given) on the left, the title (and
 * an optional subtitle) centred. The back button is marked `data-back` for the edge swipe.
 */
export default function ScreenHeader({ title, subtitle, onBack, backLabel = t('common.back') }) {
  return (
    <header className="screen-head">
      {onBack ? (
        <button className="icon" data-back aria-label={backLabel} onClick={onBack}>
          ‹
        </button>
      ) : (
        <span className="icon-spacer" />
      )}
      {subtitle ? (
        <div>
          <h1>{title}</h1>
          <p className="muted small">{subtitle}</p>
        </div>
      ) : (
        <h1>{title}</h1>
      )}
      <span className="icon-spacer" />
    </header>
  )
}
