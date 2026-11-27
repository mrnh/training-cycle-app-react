import { useState } from 'react'
import CommentDialog from './CommentDialog'
import CommentIcon from './CommentIcon'
import Planned from './Planned'
import RestSetting from './RestSetting'
import SetsDialog from './SetsDialog'
import { meetsPlan, prescriptionText, setText } from '../program'
import { t } from '../i18n'

/**
 * One exercise card, the same for main lifts and accessory work, in an open session and when
 * correcting a finished one: prescription (and last time) with rest, comment and pen on the
 * right, a toggle per set with its reps@weight underneath, then `children` (the rest timer).
 * `locked` disables the set toggles (a session not started yet). `sets` are the logged values ({ w, r, done }, null = not entered), one per set; `hints` what an
 * empty value stands for. Where the data lives is up to the callbacks.
 */
export default function SetsCard({
  name, pres, lastLine, highlight, hint, sets, hints, editable, locked,
  comment, onComment, rest, onRest, onToggle, onSaveSets, onRemove, children,
}) {
  const [commenting, setCommenting] = useState(false)
  const [editing, setEditing] = useState(false)
  const shown = (i) => ({ w: sets[i].w ?? hints[i].w ?? null, r: sets[i].r ?? hints[i].r ?? null })
  // A set's reps@weight shows under its toggle only where it differs from the plan
  const deviates = (i) => {
    const s = shown(i)
    return s.w !== (hints[i].w ?? null) || s.r !== (hints[i].r ?? null)
  }
  const cols = Math.min(sets.length, 6)

  return (
    <section className={`card ${highlight ? 'highlight' : ''}`}>
      {/* Name on the left; comment (filled when one is saved) and the pen for all sets on the right */}
      <div className="card-head">
        <h2>{name}</h2>
        {editable && (
          <span className="card-actions">
            <RestSetting rest={rest} onSave={onRest} label={name} />
            <button
              className="icon-action"
              aria-label={comment ? t('sets.commentOf', { name, comment }) : t('sets.addCommentTo', { name })}
              onClick={() => setCommenting(true)}
            >
              <CommentIcon filled={!!comment} />
            </button>
            <button className="sec-pen" aria-label={t('sets.editSets', { name })} onClick={() => setEditing(true)}>
              ✎
            </button>
          </span>
        )}
      </div>
      {(pres || lastLine) && (
        <div className="card-plan">
          {pres && <Planned sets={pres.sets} reps={pres.reps} weight={pres.weight} />}
          {lastLine && <p className="muted small">{lastLine}</p>}
        </div>
      )}
      {hint && <p className="small">{hint}</p>}
      {/* Toggles in equal columns that line up with the timer segments below, lines of up to 6
          sets; a set done differently from the plan shows its reps@weight underneath */}
      <div className="sec-sets" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {sets.map((s, i) => {
          const done = !!s.done
          const line = Math.floor(i / 6)
          const col = (i % 6) + 1
          return [
            <button
              key={`t${i}`}
              className={`set-toggle ${done ? 'is-done' : ''} ${done && !meetsPlan(shown(i), hints[i]) ? 'off-target' : ''}`}
              style={{ gridRow: line * 2 + 1, gridColumn: col }}
              aria-pressed={done}
              disabled={locked}
              aria-label={t(done ? (meetsPlan(shown(i), hints[i]) ? 'sets.toggleDone' : 'sets.toggleBelow') : 'sets.toggle', { n: i + 1, text: setText(shown(i)) })}
              onClick={() => onToggle(i, shown(i))}
            >
              {i + 1}
            </button>,
            deviates(i) && (
              <span key={`v${i}`} className="sec-value" style={{ gridRow: line * 2 + 2, gridColumn: col }}>
                {/* May break before "@" when the column is narrow (5–6 sets) */}
                {setText(shown(i), false).replace('@', '​@')}
              </span>
            ),
          ]
        })}
      </div>
      {commenting && (
        <CommentDialog title={t('sets.commentTitle', { name })} value={comment} onSave={onComment} onClose={() => setCommenting(false)} />
      )}
      {editing && (
        <SetsDialog
          title={t('sets.setsTitle', { name })}
          planned={pres && prescriptionText(pres)}
          rows={sets.map((s) => ({ w: s.w ?? null, r: s.r ?? null }))}
          hints={hints}
          onSave={onSaveSets}
          onRemove={
            onRemove &&
            (() => {
              setEditing(false)
              onRemove()
            })
          }
          onClose={() => setEditing(false)}
        />
      )}
      {children}
    </section>
  )
}
