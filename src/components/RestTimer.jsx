import { useEffect, useState } from 'react'
import Sheet from './Sheet'
import { REST_MAX, REST_MIN, REST_STEP, minSec, restOf } from '../program'

const EXTRA_REST = 15 // seconds the "add 15s" button gives
import { updateCycle } from '../store'

/** Re-renders four times a second while `running`, so the bar moves. */
function useNow(running) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [running])
  return now
}

/**
 * Interval timer of one exercise card: a bar with one segment per set, then a row with the
 * comment (left), Start/Pause/Resume (centre) and the rest interval (right). It runs for
 * interval × sets from the moment Start is tapped; ticking sets doesn't change it. While it runs,
 * "add 15s" (in place of the interval on the right) gives 15 s more rest; while paused, a reset
 * icon next to Resume clears it.
 */
export default function RestTimer({ cycle, card, sets, label, note, defaultRest }) {
  const rest = restOf(cycle, card, defaultRest)
  const total = rest * sets
  const mine = cycle.timer?.card === card
  const paused = mine && !!cycle.timer.pausedAt
  const now = useNow(mine && !paused)
  const [editing, setEditing] = useState(false)

  // A paused timer stands still at the moment it was paused
  const until = paused ? Date.parse(cycle.timer.pausedAt) : now
  const t = mine ? Math.max(0, (until - Date.parse(cycle.timer.startedAt)) / 1000) : null
  const done = t != null && t >= total
  const idx = t == null ? -1 : Math.min(sets - 1, Math.floor(t / rest))
  const fill = (i) => (t == null ? 0 : done || i < idx ? 1 : i === idx ? (t - idx * rest) / rest : 0)

  // Starting a timer replaces any other one
  const start = () =>
    updateCycle((c) => {
      c.timer = { card, startedAt: new Date().toISOString() }
    })
  const pause = () =>
    updateCycle((c) => {
      c.timer.pausedAt = new Date().toISOString()
    })
  // Resuming shifts the start by the time spent paused
  const resume = () =>
    updateCycle((c) => {
      const pausedFor = Date.now() - Date.parse(c.timer.pausedAt)
      c.timer = { card, startedAt: new Date(Date.parse(c.timer.startedAt) + pausedFor).toISOString() }
    })
  // 15 s more rest: the timer moves back by 15 s (never to before its start)
  const addRest = () =>
    updateCycle((c) => {
      const later = Math.min(Date.parse(c.timer.startedAt) + EXTRA_REST * 1000, Date.now())
      c.timer = { ...c.timer, startedAt: new Date(later).toISOString() }
    })
  const reset = () =>
    updateCycle((c) => {
      c.timer = null
    })
  const save = (v) =>
    updateCycle((c) => {
      c.rest ??= {}
      c.rest[card] = v
    })

  return (
    <>
      <div className={`rest-bar ${done ? 'is-done' : ''}`} role="progressbar" aria-label="Rest timer"
        aria-valuemin={0} aria-valuemax={total} aria-valuenow={t == null ? 0 : Math.min(total, Math.floor(t))}>
        {Array.from({ length: sets }, (_, i) => (
          <span key={i}>
            <i style={{ width: `${fill(i) * 100}%` }} />
          </span>
        ))}
      </div>
      <p className="rest-info muted small">
        {t == null ? (
          // Before the start only the total; the interval is shown by the clock on the right
          <>
            <span />
            <span>{minSec(total)}</span>
          </>
        ) : done ? (
          <span className="rest-done">Done · {minSec(total)}</span>
        ) : (
          <>
            <span>{paused && 'Paused · '}Set {idx + 1} · {minSec(Math.ceil(rest - (t - idx * rest)))} left</span>
            <span>{minSec(Math.ceil(total - t))} total</span>
          </>
        )}
      </p>
      <div className="timer-row">
        {note}
        <span className="timer-actions">
          {!mine ? (
            <button className="small-btn timer-btn" onClick={start}>▶ Start</button>
          ) : done ? (
            <button className="small-btn timer-btn" onClick={start}>↻ Restart</button>
          ) : paused ? (
            <button className="small-btn timer-btn" onClick={resume}>▶ Resume</button>
          ) : (
            <button className="small-btn timer-btn" onClick={pause}>❚❚ Pause</button>
          )}
          {paused && (
            <button className="icon-btn timer-reset" aria-label="Reset timer" onClick={reset}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12a8 8 0 1 0 2.3-5.6" />
                <path d="M4 4v4.5h4.5" />
              </svg>
            </button>
          )}
        </span>
        {/* While the timer runs, the right spot offers extra rest instead of the interval setting */}
        {mine && !paused && !done ? (
          <button className="rest-time" onClick={addRest}>
            add {EXTRA_REST}s
          </button>
        ) : (
          <button className="rest-time" aria-label={`Rest interval ${minSec(rest)}, change`} onClick={() => setEditing(true)}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2.5 2M9.5 2.5h5" />
            </svg>
            {minSec(rest)}
          </button>
        )}
      </div>
      {editing && <RestDialog title={label} value={rest} onSave={save} onClose={() => setEditing(false)} />}
    </>
  )
}

/** Rest interval in 15-second steps, 0:15 to 10:00. Nothing is saved until "Save". */
function RestDialog({ title, value, onSave, onClose }) {
  const [draft, setDraft] = useState(value)

  function save() {
    onSave(draft)
    onClose()
  }

  return (
    <Sheet onClose={onClose} onSubmit={save}>
      <h2>{title} · rest</h2>
      <p className="muted small">Time per set, including the set itself.</p>
      <div className="rest-stepper">
        <button type="button" aria-label="15 seconds less" disabled={draft <= REST_MIN} onClick={() => setDraft(draft - REST_STEP)}>−</button>
        <strong aria-live="polite">{minSec(draft)}</strong>
        <button type="button" aria-label="15 seconds more" disabled={draft >= REST_MAX} onClick={() => setDraft(draft + REST_STEP)}>+</button>
      </div>
      <div className="button-row end">
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit" className="primary">Save</button>
      </div>
    </Sheet>
  )
}
