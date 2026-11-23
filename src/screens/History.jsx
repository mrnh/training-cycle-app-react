import { useState } from 'react'
import FinishedSession from '../components/FinishedSession'
import { entryAsPrescribed, entryNotDone, finishedWorkouts, fmtDateShort, sessionName } from '../program'
import Chevron from '../components/Chevron'

/**
 * History tab: every finished workout, newest first (the sort button in the header turns the
 * order around; remembered on this device), as one table. Date and session span the
 * workout's rows; then one row per main lift, one for the accessory group and one per exercise
 * added during the workout, each with a check: green when done as prescribed, orange-yellow when
 * done otherwise, a red cross when nothing was done.
 * Tapping a workout (of any cycle) opens its finished session with all sets and weights; the
 * back arrow returns to the list at the same scroll position.
 */
const SORT_KEY = 'history-oldest-first'
const readOldestFirst = () => {
  try {
    return localStorage.getItem(SORT_KEY) === '1'
  } catch {
    return false
  }
}

export default function History({ state }) {
  const [oldestFirst, setOldestFirst] = useState(readOldestFirst)
  const toggleOrder = () => {
    setOldestFirst(!oldestFirst)
    try {
      localStorage.setItem(SORT_KEY, oldestFirst ? '0' : '1')
    } catch {
      // Storage blocked: the order just isn't remembered
    }
  }
  const newestFirst = finishedWorkouts(state)
  const workouts = oldestFirst ? [...newestFirst].reverse() : newestFirst
  const current = state.cycles.length - 1
  const [detail, setDetail] = useState(null) // { cycle, plan, record, scrollY } while one is open

  if (detail) {
    const back = () => {
      const y = detail.scrollY
      setDetail(null)
      requestAnimationFrame(() => window.scrollTo(0, y))
    }
    return (
      <div className="screen">
        <header className="session-head">
          <button className="icon" data-back aria-label="Back" onClick={back}>
            ‹
          </button>
          <div>
            <h1>{sessionName(detail.plan)}</h1>
            <p className="muted small">
              {detail.cycle !== current && `Cycle ${detail.cycle + 1} · `}Group {detail.record.group}
            </p>
          </div>
          <span className="icon-spacer" />
        </header>
        <FinishedSession record={detail.record} />
      </div>
    )
  }

  return (
    <div className="screen">
      <h1>History</h1>
      {workouts.length === 0 ? (
        <p className="muted small center">No finished workouts yet.</p>
      ) : (
        <div className="card history-card">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Session</th>
                <th>
                  <span className="sr-only">Done as prescribed</span>
                </th>
                <th>Exercise</th>
                <th className="sort">
                  <button
                    className="sort-btn"
                    aria-label={oldestFirst ? 'Oldest first. Show newest first' : 'Newest first. Show oldest first'}
                    onClick={toggleOrder}
                  >
                    <SortIcon oldestFirst={oldestFirst} />
                  </button>
                </th>
              </tr>
            </thead>
            {workouts.map(({ cycle, plan, record }) => {
              const rows = workoutRows(record)
              const open = () => {
                setDetail({ cycle, plan, record, scrollY: window.scrollY })
                window.scrollTo(0, 0)
              }
              // Each workout is its own row group, so it can be tapped as a whole
              return (
                <tbody
                  key={`${cycle}:${plan.key}`}
                  className="tappable"
                  onClick={open}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open session ${plan.week}.${plan.session}${cycle !== current ? `, cycle ${cycle + 1}` : ''}`}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open())}
                >
                  {rows.map((r, i) => (
                    <tr key={r.key}>
                      {i === 0 && (
                        <>
                          <td rowSpan={rows.length} className="when">
                            {record.finishedAt ? fmtDateShort(record.finishedAt) : '–'}
                          </td>
                          <td rowSpan={rows.length} className="when">
                            {plan.week}.{plan.session}
                          </td>
                        </>
                      )}
                      <td className="check">
                        <span className={r.status} aria-label={STATUS_LABEL[r.status]}>
                          {r.status === 'none' ? '✗' : '✓'}
                        </span>
                      </td>
                      <td className="name">{r.name}</td>
                      {/* The whole workout opens its session; the chevron marks it */}
                      {i === 0 && (
                        <td rowSpan={rows.length} className="go">
                          <Chevron size={18} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              )
            })}
          </table>
        </div>
      )}
    </div>
  )
}

// Check per row: green ✓ done as prescribed, orange-yellow ✓ done but not as prescribed,
// red ✗ nothing done at all
const STATUS_LABEL = { ok: 'done as prescribed', off: 'not as prescribed', none: 'not done' }

/** The rows of one workout: main lifts, the accessory group, then exercises added during it. */
function workoutRows(record) {
  const main = record.entries.filter((e) => e.kind === 'main')
  const group = record.entries.filter((e) => e.kind === 'secondary' && !e.added)
  const added = record.entries.filter((e) => e.kind === 'secondary' && e.added)
  const status = (entries) =>
    entries.every(entryAsPrescribed) ? 'ok' : entries.every(entryNotDone) ? 'none' : 'off'
  const row = (e, kind) => ({ key: `${kind}-${e.exerciseId}`, name: e.name, status: status([e]) })
  return [
    ...main.map((e) => row(e, 'm')),
    ...(group.length ? [{ key: 'group', name: `Accessory work ${record.group}`, status: status(group) }] : []),
    ...added.map((e) => row(e, 'a')),
  ]
}

/** Arrow next to bars that grow in the direction of the order: newest first = arrow down. */
function SortIcon({ oldestFirst }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {oldestFirst ? (
        <>
          <path d="M6 19V5M3 8l3-3 3 3" />
          <path d="M12 6h3M12 12h6M12 18h9" />
        </>
      ) : (
        <>
          <path d="M6 5v14M3 16l3 3 3-3" />
          <path d="M12 6h9M12 12h6M12 18h3" />
        </>
      )}
    </svg>
  )
}
