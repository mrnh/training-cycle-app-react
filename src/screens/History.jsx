import { useState } from 'react'
import FinishedWorkout from '../components/FinishedSession'
import Sheet from '../components/Sheet'
import { GROUPS, entryAsPrescribed, entryNotDone, exerciseName, finishedDate, finishedWorkouts, fmtDateShort, sessionName } from '../program'
import { currentCycle, update } from '../store'
import Chevron from '../components/Chevron'
import ExerciseHistory from './ExerciseHistory'
import Exercises from './Exercises'
import ScreenHeader from '../components/ScreenHeader'

const RECENT = 4 // workouts on the History tab itself; "Show all" opens the full list

/**
 * History tab: the four most recent finished workouts, and "Show all" for the All workouts
 * screen with every workout and a sort button (newest or oldest first, remembered on this
 * device). Each workout is a table row group: date and session span its rows; then one row per
 * main lift, one for the accessory group and one per exercise added during the workout, each
 * with a check: green when done as prescribed, orange-yellow when done otherwise, a red cross
 * when nothing was done.
 * Tapping a workout (of any cycle) opens its finished session with all sets and weights; the
 * back arrow returns to the list it came from at the same scroll position.
 * Below, the Exercise history card: the main lifts and up to five picked exercises (three by
 * default), each opening
 * its exercise history; "Show all" lists every exercise.
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
  const current = state.cycles.length - 1
  const [showAll, setShowAll] = useState(null) // { scrollY } of the History tab while All workouts is open
  const [detail, setDetail] = useState(null) // { cycle, plan, record, scrollY } while one is open
  const [exercise, setExercise] = useState(null) // { id, scrollY } while an exercise history is open
  const [allExercises, setAllExercises] = useState(null) // { scrollY } while All exercises is open

  const open = (w) => {
    setDetail({ ...w, scrollY: window.scrollY })
    window.scrollTo(0, 0)
  }
  // Back to the list, at the scroll position it was left at
  const backTo = (y, close) => {
    close()
    requestAnimationFrame(() => window.scrollTo(0, y))
  }

  const ex = exercise && state.catalog.find((e) => e.id === exercise.id)
  if (ex)
    return (
      <ExerciseHistory state={state} ex={ex} backLabel="Back to history" onBack={() => backTo(exercise.scrollY, () => setExercise(null))} />
    )
  if (allExercises)
    return (
      <Exercises
        state={state}
        title="All exercises"
        backLabel="Back to history"
        canAdd={false}
        onBack={() => backTo(allExercises.scrollY, () => setAllExercises(null))}
      />
    )

  if (detail) {
    return (
      <div className="screen">
        <ScreenHeader
          title={sessionName(detail.plan)}
          subtitle={finishedDate(state.cycles[detail.cycle].finished[detail.plan.key])}
          backLabel={showAll ? 'Back to all workouts' : 'Back to history'}
          onBack={() => backTo(detail.scrollY, () => setDetail(null))}
        />
        <FinishedWorkout state={state} cycleIndex={detail.cycle} planKey={detail.plan.key} />
      </div>
    )
  }

  if (showAll) {
    return (
      <div className="screen">
        <ScreenHeader title="All workouts" backLabel="Back to history" onBack={() => backTo(showAll.scrollY, () => setShowAll(null))} />
        <div className="card history-card">
          <WorkoutTable
            workouts={oldestFirst ? [...newestFirst].reverse() : newestFirst}
            current={current}
            onOpen={open}
            sort={
              <button
                className="sort-btn"
                aria-label={oldestFirst ? 'Oldest first. Show newest first' : 'Newest first. Show oldest first'}
                onClick={toggleOrder}
              >
                <SortIcon oldestFirst={oldestFirst} />
              </button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <h1>Workout history</h1>
      {newestFirst.length === 0 ? (
        <p className="muted small center">No finished workouts yet.</p>
      ) : (
        <div className="card history-card">
          <WorkoutTable workouts={newestFirst.slice(0, RECENT)} current={current} onOpen={open} />
          <button
            className="link show-all"
            onClick={() => {
              setShowAll({ scrollY: window.scrollY })
              window.scrollTo(0, 0)
            }}
          >
            Show all
          </button>
        </div>
      )}
      <ExerciseCard
        state={state}
        onOpen={(id) => {
          setExercise({ id, scrollY: window.scrollY })
          window.scrollTo(0, 0)
        }}
        onShowAll={() => {
          setAllExercises({ scrollY: window.scrollY })
          window.scrollTo(0, 0)
        }}
      />
    </div>
  )
}

const PICKS = 5 // exercises besides the main lifts that can be picked for the Exercise history card
const DEFAULT_PICKS = 3 // shown until exercises are picked: the first ones of the accessory work

/**
 * The exercises on the card besides the main lifts: up to five picked with the pen, or until then
 * the first three of the accessory work groups. Deleted exercises and main lifts are left out.
 */
function pickedExercises(state, mainIds) {
  const picked = state.historyExercises
  const ids = picked ?? GROUPS.flatMap((g) => state.groups[g].map((x) => x.id))
  const usable = (id) => !mainIds.includes(id) && state.catalog.some((e) => e.id === id)
  return [...new Set(ids)].filter(usable).slice(0, picked ? PICKS : DEFAULT_PICKS)
}

/** History tab card: main lifts, then up to five picked exercises; each opens its history. */
function ExerciseCard({ state, onOpen, onShowAll }) {
  const mainIds = currentCycle(state).primaries.filter(Boolean)
  const picked = pickedExercises(state, mainIds)
  const [editing, setEditing] = useState(false)
  const row = (id) => (
    <button key={id} className="list-row" onClick={() => onOpen(id)}>
      <span>{exerciseName(state, id)}</span>
      <Chevron size={18} />
    </button>
  )
  return (
    <>
      {/* Heading outside the card, like the screen title above; the pen picks the exercises */}
      <div className="sec-head screen-subtitle">
        <h1>Exercise history</h1>
        <button className="sec-pen" aria-label="Pick exercises" onClick={() => setEditing(true)}>
          ✎
        </button>
      </div>
      <section className="card exercise-card">
        <div className="exercise-rows">{mainIds.map(row)}</div>
        {picked.length ? (
          <div className="exercise-rows">{picked.map(row)}</div>
        ) : (
          <p className="muted small">Tap ✎ to add up to five exercises.</p>
        )}
        <button className="link show-all" onClick={onShowAll}>
          Show all
        </button>
        {editing && <PickDialog state={state} mainIds={mainIds} picked={picked} onClose={() => setEditing(false)} />}
      </section>
    </>
  )
}

/** Up to five exercises for the card, one dropdown each; main lifts are on the card anyway. */
function PickDialog({ state, mainIds, picked, onClose }) {
  const [rows, setRows] = useState(() => Array.from({ length: PICKS }, (_, i) => picked[i] ?? ''))
  const options = state.catalog.filter((e) => !mainIds.includes(e.id))
  const taken = (id, i) => rows.some((r, j) => j !== i && r === id)
  function save() {
    update((d) => void (d.historyExercises = rows.filter(Boolean)))
    onClose()
  }
  return (
    <Sheet onClose={onClose} onSubmit={save}>
      <div>
        <h2>Exercise history</h2>
        <p className="muted small">Choose up to five exercises for quick access. They are shown below the main lifts.</p>
      </div>
      {rows.map((r, i) => (
        <select
          key={i}
          aria-label={`Exercise ${i + 1}`}
          value={r}
          onChange={(e) => setRows(rows.map((x, j) => (j === i ? e.target.value : x)))}
        >
          <option value="">–</option>
          {options.map((ex) => (
            <option key={ex.id} value={ex.id} disabled={taken(ex.id, i)}>
              {ex.name}
            </option>
          ))}
        </select>
      ))}
      <div className="button-row end">
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit" className="primary">Save</button>
      </div>
    </Sheet>
  )
}

/** Workouts as a table, each one tappable as a whole; `sort` goes in the header's last cell. */
function WorkoutTable({ workouts, current, onOpen, sort }) {
  return (
    <table className="history-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Session</th>
          <th>
            <span className="sr-only">Done as prescribed</span>
          </th>
          <th>Exercise</th>
          <th className="sort">{sort}</th>
        </tr>
      </thead>
      {workouts.map((w) => {
        const { cycle, plan, record } = w
        const rows = workoutRows(record)
        const open = () => onOpen(w)
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
