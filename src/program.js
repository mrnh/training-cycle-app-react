// Russian Masters Squat Routine, adapted for three lifts.
// Every exercise lives in the catalog; squat, bench and deadlift are ordinary entries.
export const DEFAULT_CATALOG = [
  { id: 'squat', name: 'Squat' },
  { id: 'bench', name: 'Bench press' },
  { id: 'deadlift', name: 'Deadlift' },
  { id: 'back-extensions', name: 'Back Extensions' },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat' },
  { id: 'dips', name: 'Dips' },
  { id: 'nordic-curls', name: 'Nordic Curls' },
  { id: 'overhead-press', name: 'Overhead Press' },
  { id: 'pullups', name: 'Pullups' },
  { id: 'reverse-nordic-curls', name: 'Reverse Nordic Curls' },
  { id: 'seal-rows', name: 'Seal Rows' },
  { id: 'tuck-ups', name: 'Tuck-Ups' },
  { id: 'v-ups', name: 'V-Ups' },
]
// The three main-lift slots of a cycle point at catalog exercises (stored per cycle).
export const DEFAULT_PRIMARIES = ['squat', 'bench', 'deadlift']
export const exerciseName = (state, id) => state.catalog.find((e) => e.id === id)?.name ?? 'Deleted exercise'

export const WEEKS = 9
export const SESSIONS_PER_WEEK = 3
export const GROUPS = ['A', 'B', 'C']

// Variant 1 is the same every week; variant 2 builds volume, then intensity.
export const V1 = { sets: 6, reps: 2, pct: 80 }
export const V2 = [
  { sets: 6, reps: 3, pct: 80 },
  { sets: 6, reps: 4, pct: 80 },
  { sets: 6, reps: 5, pct: 80 },
  { sets: 6, reps: 6, pct: 80 },
  { sets: 5, reps: 5, pct: 85 },
  { sets: 4, reps: 4, pct: 90 },
  { sets: 3, reps: 3, pct: 95 },
  { sets: 2, reps: 2, pct: 100 },
  { sets: 1, reps: 1, pct: 105 }, // re-test
]

// Each session: one main-lift slot on variant 2, another on variant 1, plus a secondary group.
// Slots 0, 1, 2 are squat, bench and deadlift by default (see cycle.primaries).
export const ROTATION = [
  { v2: 0, v1: 2, group: 'A' },
  { v2: 1, v1: 0, group: 'B' },
  { v2: 2, v1: 1, group: 'C' },
]

export const round1 = (x) => Math.round(x * 10) / 10
export const fmt = (x) => (x == null || x === '' ? '–' : String(round1(x)))

export const sessionKey = (week, session) => `w${week}s${session}`
/** How sessions are named everywhere: "Session 1.2" = week 1, session 2. */
export const sessionName = ({ week, session }) => `Session ${week}.${session}`
export function parseKey(key) {
  const [, w, s] = key.match(/^w(\d+)s(\d+)$/)
  return { week: +w, session: +s }
}
export const setKey = (sKey, exId, i) => `${sKey}:${exId}:${i}`
// Secondary entries get their own key ("+id"), so a main lift can also be a secondary
// exercise in the same session without their sets mixing.
export const secondaryKey = (exId) => `+${exId}`

export function sessionPlan(week, session) {
  const r = ROTATION[session - 1]
  return {
    week,
    session,
    key: sessionKey(week, session),
    group: r.group,
    primaries: [
      { slot: r.v2, variant: 2, ...V2[week - 1], retest: week === WEEKS },
      { slot: r.v1, variant: 1, ...V1, retest: false },
    ],
  }
}

export const ALL_SESSIONS = Array.from({ length: WEEKS * SESSIONS_PER_WEEK }, (_, i) =>
  sessionPlan(Math.floor(i / SESSIONS_PER_WEEK) + 1, (i % SESSIONS_PER_WEEK) + 1),
)

/** Catalog id of the exercise in a planned main-lift slot for this cycle. */
export const liftOf = (cycle, p) => cycle.primaries[p.slot]
export const targetWeight = (cycle, p) => round1((cycle.oneRM[liftOf(cycle, p)] * p.pct) / 100)

/**
 * Two levels of storage:
 * - Draft: an open session lives in cycle.logs / notes / setCounts. Every tap is saved to the
 *   device straight away, so nothing is lost if the app crashes mid-workout.
 * - Finished: "Finish" turns the draft into a permanent record in cycle.finished[sessionKey]
 *   (see buildRecord) and clears the draft. Later group or name changes don't touch it.
 */
// Rest timer: each exercise card has its own interval (seconds), stored per session card in
// cycle.rest. One timer runs at a time (cycle.timer = { card, startedAt }); it runs for
// interval × number of sets.
export const DEFAULT_REST = 120
export const restOf = (cycle, card) => cycle.rest?.[card] ?? DEFAULT_REST
/** 125 -> "2:05" */
export const minSec = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export const isFinished = (cycle, plan) => !!cycle.finished[plan.key]

/** Main-lift sets ticked / total in a draft. */
export function sessionProgress(cycle, plan) {
  let done = 0
  let total = 0
  for (const p of plan.primaries) {
    for (let i = 0; i < p.sets; i++) {
      total++
      if (cycle.logs[setKey(plan.key, liftOf(cycle, p), i)]?.done) done++
    }
  }
  return { done, total, complete: done === total }
}

export const nextSession = (cycle) => ALL_SESSIONS.find((p) => !isFinished(cycle, p)) ?? null

/**
 * One session is open at a time (cycle.active = { key, startedAt }). Only an open session can
 * be logged; the others are previews. Sessions are started in order: the one after the open
 * session, or the first unfinished one when none is open.
 */
export const activeSession = (cycle) => (cycle.active ? ALL_SESSIONS.find((p) => p.key === cycle.active.key) : null)
export function startableSession(cycle) {
  const active = activeSession(cycle)
  if (!active) return nextSession(cycle)
  return ALL_SESSIONS[ALL_SESSIONS.indexOf(active) + 1] ?? null
}

/** Start a session (mutates). An open session is finished as it is first. */
export function startSession(state, cycle, plan, now = new Date()) {
  const open = activeSession(cycle)
  if (open && open.key !== plan.key) finishSession(state, cycle, open, isoDay(now))
  cycle.active = { key: plan.key, startedAt: now.toISOString() }
}

/** Catalog ids of the secondary exercises in a draft: its group, plus any already logged. */
export function draftSecondaries(state, cycle, plan) {
  const ids = [...state.groups[plan.group]]
  for (const obj of [cycle.logs, cycle.setCounts, cycle.notes]) {
    for (const k of Object.keys(obj)) {
      const [sk, entry] = k.split(':')
      if (sk === plan.key && entry?.startsWith('+') && !ids.includes(entry.slice(1))) ids.push(entry.slice(1))
    }
  }
  return ids
}

/** The permanent record of a session, built from its draft. */
export function buildRecord(state, cycle, plan, finishedAt) {
  const main = plan.primaries.map((p) => {
    const id = liftOf(cycle, p)
    const keys = Array.from({ length: p.sets }, (_, i) => setKey(plan.key, id, i))
    const planned = targetWeight(cycle, p)
    return {
      kind: 'main',
      exerciseId: id,
      name: exerciseName(state, id),
      sets: p.sets,
      reps: p.reps,
      pct: p.pct,
      retest: p.retest,
      planned,
      weight: cycle.logs[keys[0]]?.w ?? planned,
      done: keys.map((k) => !!cycle.logs[k]?.done),
      rest: restOf(cycle, `${plan.key}:${id}`),
      note: cycle.notes[`${plan.key}:${id}`] || undefined,
    }
  })
  const secondary = draftSecondaries(state, cycle, plan).map((id) => {
    const entry = secondaryKey(id)
    const sets = []
    for (let i = 0; i < 12; i++) {
      const log = cycle.logs[setKey(plan.key, entry, i)]
      if (log && (log.done || log.w != null || log.r != null)) sets.push({ w: log.w ?? null, r: log.r ?? null, done: !!log.done })
    }
    return { kind: 'secondary', exerciseId: id, name: exerciseName(state, id), sets, rest: restOf(cycle, `${plan.key}:${entry}`), note: cycle.notes[`${plan.key}:${entry}`] || undefined }
  })
  return { finishedAt, group: plan.group, note: cycle.notes[plan.key] || undefined, entries: [...main, ...secondary] }
}

/** Move a session from draft to finished (mutates the cycle). */
export function finishSession(state, cycle, plan, finishedAt) {
  cycle.finished[plan.key] = buildRecord(state, cycle, plan, finishedAt)
  const own = (k) => k === plan.key || k.startsWith(`${plan.key}:`)
  for (const obj of [cycle.logs, cycle.notes, cycle.setCounts, cycle.rest ?? {}]) {
    for (const k of Object.keys(obj)) if (own(k)) delete obj[k]
  }
  if (cycle.active?.key === plan.key) cycle.active = null
  if (cycle.timer && own(cycle.timer.card)) cycle.timer = null
}

/** Main-lift sets not ticked, per lift, for the Finish dialog. */
export function untickedSets(cycle, plan) {
  return plan.primaries
    .map((p) => {
      const id = liftOf(cycle, p)
      const done = Array.from({ length: p.sets }, (_, i) => cycle.logs[setKey(plan.key, id, i)]?.done).filter(Boolean).length
      return { id, missing: p.sets - done, total: p.sets }
    })
    .filter((x) => x.missing > 0)
}

/** The ticked week-9 single for each main lift, from the finished re-test sessions; null if not ticked. */
export function retestResults(cycle) {
  const out = {}
  cycle.primaries.forEach((id, slot) => {
    const s = ROTATION.findIndex((r) => r.v2 === slot) + 1
    const rec = cycle.finished[sessionKey(WEEKS, s)]
    const e = rec?.entries.find((x) => x.kind === 'main' && x.retest)
    out[id] = e?.done[0] ? e.weight : null
  })
  return out
}

/** The cycle is complete once its last session (week 9, session 3) is finished. */
export const cycleComplete = (cycle) => !!cycle.finished[sessionKey(WEEKS, SESSIONS_PER_WEEK)]

export function addDays(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d
}
export const shortDate = (d) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
export const weekStart = (cycle, week) => addDays(cycle.startDate, (week - 1) * 7)
const dayMonth = (d) => `${d.getDate()}.${d.getMonth() + 1}.`
/** "23.11. – 29.11." */
export const weekRange = (cycle, week) =>
  `${dayMonth(weekStart(cycle, week))} – ${dayMonth(addDays(cycle.startDate, (week - 1) * 7 + 6))}`

/** crypto.randomUUID only exists on https/localhost; phones on the local network use plain http. */
export const newId = () =>
  crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
const isoDay = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const todayIso = () => isoDay(new Date())
/** "18:05" */
export const clockTime = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

/**
 * Finished sessions of an exercise across every cycle, oldest first. `kind` is 'main' or
 * 'secondary'. Only ticked sets count as done work.
 */
export function exerciseHistory(state, exId, kind) {
  const out = []
  state.cycles.forEach((cycle, ci) => {
    ALL_SESSIONS.forEach((plan, si) => {
      const rec = cycle.finished[plan.key]
      if (!rec) return
      for (const e of rec.entries) {
        if (e.exerciseId !== exId || e.kind !== kind) continue
        const sets =
          e.kind === 'main'
            ? e.done.flatMap((d) => (d ? [{ w: e.weight, r: e.reps, done: true }] : []))
            : e.sets.filter((x) => x.done)
        if (sets.length) out.push({ cycle: ci, order: si, week: plan.week, session: plan.session, sets, note: e.note })
      }
    })
  })
  return out
}

export const setsSummary = (sets) => sets.map((s) => `${fmt(s.w)}×${s.r ?? '–'}`).join(', ')

/** "2026-11-19" -> "19.11.2026" */
export const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${+d}.${+m}.${y}`
}
