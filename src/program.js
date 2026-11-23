// Russian Masters Squat Routine, adapted for up to three main lifts.
// Every exercise lives in the catalog; the main lifts of a cycle are ordinary entries.
export const DEFAULT_CATALOG = [
  { id: 'squat', name: 'Squat' },
  { id: 'bench', name: 'Bench Press' },
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

// Each session: one main-lift slot on variant 2, another on variant 1, plus an accessory group.
// Slots 0, 1, 2 are squat, bench and deadlift by default (see cycle.primaries). A slot can be
// empty (null): its sets are left out of every session.
export const ROTATION = [
  { v2: 0, v1: 2, group: 'A' },
  { v2: 1, v1: 0, group: 'B' },
  { v2: 2, v1: 1, group: 'C' },
]

export const round1 = (x) => Math.round(x * 10) / 10
export const fmt = (x) => (x == null || x === '' ? '–' : String(round1(x)))

// Weight unit shown next to every number: "kg" or "lbs". Only a label, numbers are never converted.
export const UNITS = ['kg', 'lbs']
let currentUnit = 'kg'
export const unit = () => currentUnit
export const setUnit = (u) => void (currentUnit = UNITS.includes(u) ? u : 'kg')
// Date format: 'dmy' (9.11.2026, default) or 'mdy' (11/9/2026, common in the US)
export const DATE_FORMATS = [
  { id: 'dmy', label: '31.12.' },
  { id: 'mdy', label: '12/31' },
]
let currentDateFormat = 'dmy'
export const dateFormat = () => currentDateFormat
export const setDateFormat = (f) => void (currentDateFormat = f === 'mdy' ? 'mdy' : 'dmy')
// Rounding of planned main-lift weights (1RM × %): to 0.1, whole units (default) or 2.5, either
// to the nearest step ('regular') or always up ('up', default)
export const ROUNDINGS = [0.1, 1, 2.5]
export const ROUNDING_MODES = [
  { id: 'regular', label: 'Regular' },
  { id: 'up', label: 'Round up' },
]
let currentRounding = 1
let currentRoundingMode = 'up'
export const rounding = () => currentRounding
export const roundingMode = () => currentRoundingMode
export const setRounding = (r) => void (currentRounding = ROUNDINGS.includes(r) ? r : 1)
export const setRoundingMode = (m) => void (currentRoundingMode = m === 'regular' ? 'regular' : 'up')
/**
 * Round to the chosen step: 85.6 -> 86 (whole) or 85 (2.5) regularly, 86 or 87.5 when rounding
 * up. The tiny tolerance keeps float noise (855.9999… steps) from rounding up a whole step.
 */
export const roundToStep = (x, step = currentRounding, mode = currentRoundingMode) =>
  round1((mode === 'up' ? Math.ceil(x / step - 1e-9) : Math.round(x / step)) * step)

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

/** Catalog id of the exercise in a planned main-lift slot for this cycle; null = empty slot. */
export const liftOf = (cycle, p) => cycle.primaries[p.slot] ?? null
/** The planned main lifts of a session whose slot has an exercise in this cycle. */
export const mainLifts = (cycle, plan) => plan.primaries.filter((p) => liftOf(cycle, p))
export const targetWeight = (cycle, p) => roundToStep((cycle.oneRM[liftOf(cycle, p)] * p.pct) / 100)
/** Main-lift slots being edited ([{ id, rm }], id '' = empty): at least one lift, and a 1RM for each picked lift. */
export function mainLiftsError(rows) {
  const picked = rows.filter((r) => r.id)
  if (!picked.length) return 'Pick at least one main lift.'
  if (picked.some((r) => !(r.rm > 0))) return 'Enter a 1RM for each main lift.'
  return ''
}

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
export const REST_MIN = 15
export const REST_MAX = 600
export const REST_STEP = 15
// Most sets an accessory exercise can have (prescription, sets dialog, stored records)
export const MAX_SETS = 12
export const restOf = (cycle, card, fallback = DEFAULT_REST) => cycle.rest?.[card] ?? fallback

// Secondary exercises: each group entry carries its prescription (fixed for the cycle) and the
// rest interval the timer starts with. Weight 0 = bodyweight.
export const DEFAULT_PRESCRIPTION = { sets: 3, reps: 10, weight: 0, rest: DEFAULT_REST }
export const groupEntry = (state, group, id) => state.groups[group].find((e) => e.id === id) ?? null
// Exercises added during a workout, for that session only: cycle.extras[sessionKey] =
// [{ id, sets, reps, weight, rest }] like a group entry. Removable until the session is finished.
export const sessionExtras = (cycle, plan) => cycle.extras?.[plan.key] ?? []
export const isExtra = (cycle, plan, id) => sessionExtras(cycle, plan).some((e) => e.id === id)
/** The prescription of an accessory exercise in a session: its group entry, else the one added there. */
export const sessionEntry = (state, cycle, plan, id) =>
  groupEntry(state, plan.group, id) ?? sessionExtras(cycle, plan).find((e) => e.id === id) ?? null
/** "3×10 @ 30 kg" */
export const prescriptionText = (p) => `${p.sets}×${p.reps} @ ${fmt(p.weight)} ${unit()}`
/** 125 -> "2:05" */
export const minSec = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export const isFinished = (cycle, plan) => !!cycle.finished[plan.key]

/** Number of sets of a main lift in a session: the program's, unless changed in the sets dialog. */
export const mainSetCount = (cycle, plan, p) => cycle.setCounts[`${plan.key}:${liftOf(cycle, p)}`] ?? p.sets

/** Main-lift sets ticked / total in a draft. */
export function sessionProgress(cycle, plan) {
  let done = 0
  let total = 0
  for (const p of mainLifts(cycle, plan)) {
    for (let i = 0; i < mainSetCount(cycle, plan, p); i++) {
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

/** Catalog ids of the secondary exercises in a draft: its group, the ones added, plus any already logged. */
export function draftSecondaries(state, cycle, plan) {
  const ids = state.groups[plan.group].map((e) => e.id)
  for (const e of sessionExtras(cycle, plan)) if (!ids.includes(e.id)) ids.push(e.id)
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
  // Main lifts: every set is kept (ticked or not); an untouched set stands for the prescription
  const main = mainLifts(cycle, plan).map((p) => {
    const id = liftOf(cycle, p)
    const planned = targetWeight(cycle, p)
    const sets = Array.from({ length: mainSetCount(cycle, plan, p) }, (_, i) => {
      const log = cycle.logs[setKey(plan.key, id, i)]
      return { w: log?.w ?? planned, r: log?.r ?? p.reps, done: !!log?.done }
    })
    return {
      kind: 'main',
      exerciseId: id,
      name: exerciseName(state, id),
      pct: p.pct,
      retest: p.retest,
      prescription: { sets: p.sets, reps: p.reps, weight: planned },
      sets,
      rest: restOf(cycle, `${plan.key}:${id}`),
      note: cycle.notes[`${plan.key}:${id}`] || undefined,
    }
  })
  const secondary = draftSecondaries(state, cycle, plan).map((id) => {
    const entry = secondaryKey(id)
    const sets = []
    for (let i = 0; i < MAX_SETS; i++) {
      const log = cycle.logs[setKey(plan.key, entry, i)]
      if (log && (log.done || log.w != null || log.r != null)) sets.push({ w: log.w ?? null, r: log.r ?? null, done: !!log.done })
    }
    const pres = sessionEntry(state, cycle, plan, id)
    return {
      kind: 'secondary',
      exerciseId: id,
      name: exerciseName(state, id),
      ...(isExtra(cycle, plan, id) && { added: true }), // added during the workout, not from the group
      prescription: pres ? { sets: pres.sets, reps: pres.reps, weight: pres.weight } : undefined,
      sets,
      rest: restOf(cycle, `${plan.key}:${entry}`, pres?.rest),
      note: cycle.notes[`${plan.key}:${entry}`] || undefined }
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
  if (cycle.extras) delete cycle.extras[plan.key]
  if (cycle.active?.key === plan.key) cycle.active = null
  if (cycle.timer && own(cycle.timer.card)) cycle.timer = null
}

/** Remove an exercise added during the open session, with everything logged for it (mutates). */
export function removeExtra(cycle, plan, id) {
  cycle.extras[plan.key] = sessionExtras(cycle, plan).filter((e) => e.id !== id)
  const prefix = `${plan.key}:${secondaryKey(id)}`
  for (const obj of [cycle.logs, cycle.notes, cycle.setCounts, cycle.rest ?? {}]) {
    for (const k of Object.keys(obj)) if (k === prefix || k.startsWith(`${prefix}:`)) delete obj[k]
  }
  if (cycle.timer?.card === prefix) cycle.timer = null
}

/** Main-lift sets not ticked, per lift, for the Finish dialog. */
export function untickedSets(cycle, plan) {
  return mainLifts(cycle, plan)
    .map((p) => {
      const id = liftOf(cycle, p)
      const total = mainSetCount(cycle, plan, p)
      const done = Array.from({ length: total }, (_, i) => cycle.logs[setKey(plan.key, id, i)]?.done).filter(Boolean).length
      return { id, missing: total - done, total }
    })
    .filter((x) => x.missing > 0)
}

/** The ticked week-9 single for each main lift, from the finished re-test sessions; null if not ticked. */
export function retestResults(cycle) {
  const out = {}
  cycle.primaries.forEach((id, slot) => {
    if (!id) return
    const s = ROTATION.findIndex((r) => r.v2 === slot) + 1
    const rec = cycle.finished[sessionKey(WEEKS, s)]
    const e = rec?.entries.find((x) => x.kind === 'main' && x.retest && x.exerciseId === id)
    out[id] = e?.sets[0]?.done ? e.sets[0].w : null
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
export const weekStart = (cycle, week) => addDays(cycle.startDate, (week - 1) * 7)
// "9.11." or, in US format, "11/9"
const dayMonth = (d) => (dateFormat() === 'mdy' ? `${d.getMonth() + 1}/${d.getDate()}` : `${d.getDate()}.${d.getMonth() + 1}.`)
/** "23.11. – 29.11." */
export const weekRange = (cycle, week) =>
  `${dayMonth(weekStart(cycle, week))} – ${dayMonth(addDays(cycle.startDate, (week - 1) * 7 + 6))}`

/** crypto.randomUUID only exists on https/localhost; phones on the local network use plain http. */
export const newId = () =>
  crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
/** Local date as "2026-11-21" */
export const isoDay = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const todayIso = () => isoDay(new Date())
/** "18:05" */
export const clockTime = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

/**
 * Finished sessions of an exercise across every cycle, oldest first. `kind` ('main' or
 * 'secondary') limits it to one kind; without it both count. Only ticked sets count as done work.
 */
export function exerciseHistory(state, exId, kind) {
  const out = []
  state.cycles.forEach((cycle, ci) => {
    ALL_SESSIONS.forEach((plan, si) => {
      const rec = cycle.finished[plan.key]
      if (!rec) return
      for (const e of rec.entries) {
        if (e.exerciseId !== exId || (kind && e.kind !== kind)) continue
        const sets = e.sets.filter((x) => x.done)
        if (sets.length) out.push({ cycle: ci, order: si, kind: e.kind, week: plan.week, session: plan.session, date: rec.finishedAt, sets, note: e.note })
      }
    })
  })
  return out
}

/** Heaviest ticked weight of any rep count in an exercise's history; null if never done. */
export function heaviestWeight(state, exId) {
  const ws = exerciseHistory(state, exId).flatMap((h) => h.sets.map((s) => s.w ?? 0))
  return ws.length ? Math.max(...ws) : null
}

/**
 * Heaviest ticked set for exactly 1, 2, … `maxReps` reps, from exerciseHistory rows (oldest
 * first). Index 0 is 1 RM: { w, date } with the date it was first lifted (null if unknown), or
 * null = never done for that many reps. w = 0 means done at bodyweight.
 */
export function bestByReps(history, maxReps = 5) {
  const best = Array(maxReps).fill(null)
  for (const h of history) {
    for (const s of h.sets) {
      if (!(s.r >= 1 && s.r <= maxReps)) continue
      const w = s.w ?? 0
      // Strictly heavier only, so a repeat of the same weight keeps the first date
      if (best[s.r - 1] == null || w > best[s.r - 1].w) best[s.r - 1] = { w, date: h.date ?? null }
    }
  }
  return best
}

/**
 * One set as reps@weight: 8 reps at 15 kg -> "8@15kg" ("8@15" with `withUnit` false, for the
 * narrow spot under a set toggle). Without external weight (0 or empty) it's just the reps: "10 reps".
 */
export const setText = (s, withUnit = true) =>
  s.w ? `${s.r ?? '–'}@${fmt(s.w)}${withUnit ? unit() : ''}` : `${s.r ?? '–'} reps`
/**
 * Compact summary of done sets for "Last time". Consecutive sets with the same weight form a
 * group (order is kept, so 40, 45, 40 kg are three groups). A group with equal reps is "3×10",
 * otherwise "10-9-7"; a single set is just "10". Each group gets "@ 40 kg"; when no set used
 * external weight it ends in "reps" instead.
 *   10,10,10 (0 kg)          -> "3×10 reps"
 *   10,9,7 (0 kg)            -> "10-9-7 reps"
 *   10,10 @40, 10,7 @45      -> "2×10 @ 40 kg, 10-7 @ 45 kg"
 *   10,10 @0, 8 @10          -> "2×10 @ 0 kg, 8 @ 10 kg"
 */
export function setsSummary(sets) {
  if (!sets.length) return ''
  const groups = []
  for (const s of sets) {
    const w = s.w ?? 0
    const g = groups.at(-1)
    if (g && g.w === w) g.reps.push(s.r)
    else groups.push({ w, reps: [s.r] })
  }
  const repsText = (reps) => {
    const r = reps.map((x) => x ?? '–')
    if (r.length === 1) return `${r[0]}`
    return r.every((x) => x === r[0]) ? `${r.length}×${r[0]}` : r.join('-')
  }
  const bodyweightOnly = groups.length === 1 && groups[0].w === 0
  if (bodyweightOnly) return `${repsText(groups[0].reps)} reps`
  return groups.map((g) => `${repsText(g.reps)} @ ${fmt(g.w)} ${unit()}`).join(', ')
}

/** "2026-11-09" -> "9.11.2026", or in US format "11/9/2026" */
export const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-')
  return dateFormat() === 'mdy' ? `${+m}/${+d}/${y}` : `${+d}.${+m}.${y}`
}
/** Two-digit year for tight spots: "9.11.26" or "11/9/26" */
export const fmtDateShort = (iso) => fmtDate(iso).replace(/(\d{2})(\d{2})$/, '$2')

/**
 * Every finished workout across all cycles, newest first: { cycle (index), plan, record }.
 * Ordered by cycle and position in the plan, which also works for records without a date.
 */
export function finishedWorkouts(state) {
  const out = []
  state.cycles.forEach((cycle, ci) => {
    for (const plan of ALL_SESSIONS) if (cycle.finished[plan.key]) out.push({ cycle: ci, plan, record: cycle.finished[plan.key] })
  })
  return out.reverse()
}

/**
 * Whether a set reached its plan ({ w, r }): at least the planned reps and at least the planned
 * weight. More is fine (e.g. 87.5 kg where 85.6 was planned, because of the plates at hand).
 */
export const meetsPlan = (set, plan) => (set.r ?? 0) >= (plan.r ?? 0) && (set.w ?? 0) >= (plan.w ?? 0)

/**
 * Whether a finished exercise entry was done as prescribed (the History checks): every logged set
 * ticked and at least the planned number of sets. Main lifts must also meet the planned reps and
 * weight in every set (more is fine); for accessory work, ticking all sets is enough.
 */
export function entryAsPrescribed(e) {
  const p = e.prescription
  if (!e.sets.length || !e.sets.every((s) => s.done)) return false
  if (!p) return true
  if (e.sets.length < p.sets) return false
  return e.kind !== 'main' || e.sets.every((s) => meetsPlan(s, { w: p.weight, r: p.reps }))
}

/** No set of a finished exercise entry was ticked at all: no work done. */
export const entryNotDone = (e) => !e.sets.some((s) => s.done)
