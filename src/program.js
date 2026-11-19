// Russian Masters Squat Routine, adapted for three lifts.
export const PRIMARY = [
  { id: 'squat', name: 'Squat' },
  { id: 'bench', name: 'Bench press' },
  { id: 'deadlift', name: 'Deadlift' },
]
export const liftName = (id) => PRIMARY.find((p) => p.id === id)?.name ?? id

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

// Each session: one lift on variant 2, another on variant 1, plus a secondary group.
export const ROTATION = [
  { v2: 'squat', v1: 'deadlift', group: 'A' },
  { v2: 'bench', v1: 'squat', group: 'B' },
  { v2: 'deadlift', v1: 'bench', group: 'C' },
]

export const round1 = (x) => Math.round(x * 10) / 10
export const fmt = (x) => (x == null || x === '' ? '–' : String(round1(x)))

export const sessionKey = (week, session) => `w${week}s${session}`
export function parseKey(key) {
  const [, w, s] = key.match(/^w(\d+)s(\d+)$/)
  return { week: +w, session: +s }
}
export const setKey = (sKey, exId, i) => `${sKey}:${exId}:${i}`

export function sessionPlan(week, session) {
  const r = ROTATION[session - 1]
  return {
    week,
    session,
    key: sessionKey(week, session),
    group: r.group,
    primaries: [
      { lift: r.v2, variant: 2, ...V2[week - 1], retest: week === WEEKS },
      { lift: r.v1, variant: 1, ...V1, retest: false },
    ],
  }
}

export const ALL_SESSIONS = Array.from({ length: WEEKS * SESSIONS_PER_WEEK }, (_, i) =>
  sessionPlan(Math.floor(i / SESSIONS_PER_WEEK) + 1, (i % SESSIONS_PER_WEEK) + 1),
)

export const targetWeight = (cycle, p) => round1((cycle.oneRM[p.lift] * p.pct) / 100)

/** Sets ticked / total for the primary lifts (secondary sets are optional). */
export function sessionProgress(cycle, plan) {
  let done = 0
  let total = 0
  for (const p of plan.primaries) {
    for (let i = 0; i < p.sets; i++) {
      total++
      if (cycle.logs[setKey(plan.key, p.lift, i)]?.done) done++
    }
  }
  return { done, total, complete: done === total }
}

export const nextSession = (cycle) =>
  ALL_SESSIONS.find((p) => !sessionProgress(cycle, p).complete) ?? null

/** The ticked week-9 single for each lift, or null if not done yet. */
export function retestResults(cycle) {
  const out = {}
  for (const { id } of PRIMARY) {
    const s = ROTATION.findIndex((r) => r.v2 === id) + 1
    const plan = sessionPlan(WEEKS, s)
    const log = cycle.logs[setKey(plan.key, id, 0)]
    out[id] = log?.done ? (log.w ?? targetWeight(cycle, plan.primaries[0])) : null
  }
  return out
}

export const retestComplete = (cycle) =>
  [1, 2, 3].every((s) => sessionProgress(cycle, sessionPlan(WEEKS, s)).complete)

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
export const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** All logged sets of an exercise across every cycle, oldest first. */
export function exerciseHistory(state, exId) {
  const out = []
  state.cycles.forEach((cycle, ci) => {
    ALL_SESSIONS.forEach((plan, si) => {
      const sets = []
      for (let i = 0; i < 12; i++) {
        const log = cycle.logs[setKey(plan.key, exId, i)]
        // Only ticked sets count as done work. An adjusted "weight used" on sets that weren't
        // ticked (yet) must not show up in history or as "last time".
        if (log?.done) sets.push({ i, ...log })
      }
      if (sets.length) out.push({ cycle: ci, order: si, week: plan.week, session: plan.session, sets, note: cycle.notes[`${plan.key}:${exId}`] })
    })
  })
  return out
}

export const setsSummary = (sets) => sets.map((s) => `${fmt(s.w)}×${s.r ?? '–'}`).join(', ')
