/*
 * Training programs, as plain data. A program is a table of weeks, each with its sessions; the
 * rest of the app reads the plan only through the helpers in program.js (sessionsOf, sessionPlan,
 * ...), so it never assumes a number of weeks, sessions per week or main lifts.
 *
 * Definition (see defineProgram):
 *   id            stored on every cycle ("cycle.program")
 *   (its name and description are texts: programs.<id>.name / .description in the language file)
 *   defaultLifts  catalog ids of the main-lift slots a new cycle starts with; the number of
 *                 slots is the program's choice. A slot can be left empty by the user: its sets
 *                 are then left out of every session.
 *   weeks         per week an array of sessions: { group, lifts: [{ slot, sets, reps, pct, retest? }] }
 *                 group = accessory work group of the session. retest marks the set whose weight
 *                 becomes the lift's 1RM for the next cycle. A lift whose sets differ (5/3/1) has
 *                 setPlan: [{ reps, pct, plus? }], one entry per set; plus = "as many reps as
 *                 possible, at least these"; sets/reps/pct then describe the last (top) set.
 *   options       choices made when a cycle is started, stored in cycle.options:
 *                 { name: { values: [...], default } }. With options, `build(options)` returns the
 *                 weeks instead of `weeks`; each combination is a variant of the program.
 *   maxFactor     (options) => number: how much of the entered number the percentages apply to
 *                 (5/3/1: 0.9 when a 1RM is entered, 1 for a training max); default 1
 *   increase      what the next cycle suggests per main-lift slot (kg), for programs without a
 *                 re-test: the maximum goes up by that much (doubled when the unit is lbs)
 *
 * defineProgram turns that into plans: { week, session, key, group, primaries }, in order, where
 * key ("w2s3") is how a session is stored and found. `program.variant(options)` gives the plans
 * for a combination of options; the program itself is the variant with the default options.
 */
export const sessionKey = (week, session) => `w${week}s${session}`

function defineProgram({ id, defaultLifts, options = {}, increase, maxFactor = () => 1, weeks, build }) {
  const defaults = Object.fromEntries(Object.entries(options).map(([name, o]) => [name, o.default]))
  const cache = new Map()
  const make = (chosen) => {
    const plans = (build ? build(chosen) : weeks).map((sessions, w) =>
      sessions.map((s, i) => ({
        week: w + 1,
        session: i + 1,
        key: sessionKey(w + 1, i + 1),
        group: s.group,
        primaries: s.lifts.map((l) => ({ retest: false, ...l })),
      })),
    )
    const sessions = plans.flat()
    // The accessory work groups the sessions use, in order of first use (each program has its own lists)
    const groups = [...new Set(sessions.map((p) => p.group))]
    return { id, defaultLifts, options, defaults, increase, chosen, maxFactor: maxFactor(chosen), weeks: plans, weekCount: plans.length, sessions, groups, variant }
  }
  const variant = (chosen = {}) => {
    const all = { ...defaults, ...chosen }
    const key = JSON.stringify(all)
    if (!cache.has(key)) cache.set(key, make(all))
    return cache.get(key)
  }
  return variant()
}
/** Every combination of a program's options as a variant (just the program itself when it has none). */
export function allVariants(program) {
  let combos = [{}]
  for (const [name, option] of Object.entries(program.options)) {
    combos = combos.flatMap((c) => option.values.map((value) => ({ ...c, [name]: value })))
  }
  return combos.map((c) => program.variant(c))
}
/** Number of the session (within the first week) that adds a group; null when the group isn't used in week 1. */
export const groupSession = (program, group) => program.weeks[0].find((s) => s.group === group)?.session ?? null

/*
 * Russian Masters Program (3 main lifts). Each session has one
 * main-lift slot on variant 2 (builds volume, then intensity) and another on variant 1 (the same
 * every week), plus an accessory group. Slots 0, 1, 2 are squat, bench and deadlift by default.
 */
const V1 = { sets: 6, reps: 2, pct: 80 }
const V2 = [
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
const ROTATION = [
  { v2: 0, v1: 2, group: 'A' },
  { v2: 1, v1: 0, group: 'B' },
  { v2: 2, v1: 1, group: 'C' },
]

export const RUSSIAN_MASTERS = defineProgram({
  id: 'russian-masters',
  defaultLifts: ['squat', 'bench', 'deadlift'],
  weeks: V2.map((v2, w) =>
    ROTATION.map((r) => ({
      group: r.group,
      lifts: [
        { slot: r.v2, ...v2, retest: w === V2.length - 1 },
        { slot: r.v1, ...V1 },
      ],
    })),
  ),
})

/*
 * Russian Squat Program (1 main lift): 18 sessions that alternate between 6×2 at 80% (group A) and
 * the weekly steps of the table above (group B), so the last session, the 18th, is the 1×1
 * re-test. Option days: 2 sessions a week (9 weeks) or 3 (6 weeks); the sessions just continue
 * across the weeks.
 */
export const RUSSIAN_SQUAT_1 = defineProgram({
  id: 'russian-squat-1',
  defaultLifts: ['squat'],
  options: { days: { values: [2, 3], default: 2 } },
  build: ({ days }) => {
    const all = V2.flatMap((v2, w) => [
      { group: 'A', lifts: [{ slot: 0, ...V1 }] },
      { group: 'B', lifts: [{ slot: 0, ...v2, retest: w === V2.length - 1 }] },
    ])
    const weeks = []
    for (let i = 0; i < all.length; i += days) weeks.push(all.slice(i, i + days))
    return weeks
  },
})

/*
 * 5/3/1 (Jim Wendler): four lifts, each trained once per 4-week block with a different scheme each
 * week (5s, 3s, 5/3/1, deload). The percentages are of the training max, which is 90% of the
 * 1RM; with the option tmInput the user enters the training max directly. The last set of the
 * three working weeks is a "plus" set. Lifts, in session order: overhead press, deadlift, bench
 * press, squat; each lift has its own accessory group (A to D).
 * Option days: 4 sessions a week, one lift each (4 weeks), or 3 sessions a week with the lifts
 * rotating through them (16 sessions in 6 weeks).
 */
const SCHEMES_531 = [
  [{ reps: 5, pct: 65 }, { reps: 5, pct: 75 }, { reps: 5, pct: 85, plus: true }],
  [{ reps: 3, pct: 70 }, { reps: 3, pct: 80 }, { reps: 3, pct: 90, plus: true }],
  [{ reps: 5, pct: 75 }, { reps: 3, pct: 85 }, { reps: 1, pct: 95, plus: true }],
  [{ reps: 5, pct: 40 }, { reps: 5, pct: 50 }, { reps: 5, pct: 60 }],
]
export const WENDLER_531 = defineProgram({
  id: 'wendler-531',
  defaultLifts: ['overhead-press', 'deadlift', 'bench', 'squat'],
  options: { days: { values: [4, 3], default: 4 }, tmInput: { values: [false, true], default: false } },
  increase: [2.5, 5, 2.5, 5],
  maxFactor: ({ tmInput }) => (tmInput ? 1 : 0.9), // the training max is 90% of a 1RM
  build: ({ days, tmInput }) => {
    const factor = tmInput ? 1 : 0.9
    const session = (slot, week) => {
      const setPlan = SCHEMES_531[week].map((x) => ({ ...x, pct: Math.round(x.pct * factor * 100) / 100 }))
      const top = setPlan.at(-1)
      return { group: 'ABCD'[slot], lifts: [{ slot, sets: setPlan.length, reps: top.reps, pct: top.pct, setPlan }] }
    }
    const all = SCHEMES_531.flatMap((_, week) => [0, 1, 2, 3].map((slot) => session(slot, week)))
    const weeks = []
    for (let i = 0; i < all.length; i += days) weeks.push(all.slice(i, i + days))
    return weeks
  },
})

export const PROGRAMS = [RUSSIAN_MASTERS, RUSSIAN_SQUAT_1, WENDLER_531]
export const DEFAULT_PROGRAM = RUSSIAN_MASTERS
