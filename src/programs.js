/*
 * Training programs, as plain data. A program is a table of weeks, each with its sessions; the
 * rest of the app reads the plan only through the helpers in program.js (sessionsOf, sessionPlan,
 * ...), so it never assumes a number of weeks, sessions per week or main lifts.
 *
 * Definition (see defineProgram):
 *   id            stored on every cycle ("cycle.program")
 *   (its name is a text: programs.<id>.name in the language file)
 *   defaultLifts  catalog ids of the main-lift slots a new cycle starts with; the number of
 *                 slots is the program's choice. A slot can be left empty by the user: its sets
 *                 are then left out of every session.
 *   weeks         per week an array of sessions: { group, lifts: [{ slot, sets, reps, pct, retest? }] }
 *                 group = accessory work group of the session. retest marks the set whose weight
 *                 becomes the lift's 1RM for the next cycle (and its goal weight at that %).
 *
 * defineProgram turns that into plans: { week, session, key, group, primaries }, in order, where
 * key ("w2s3") is how a session is stored and found.
 */
export const sessionKey = (week, session) => `w${week}s${session}`

function defineProgram({ id, defaultLifts, weeks }) {
  const plans = weeks.map((sessions, w) =>
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
  return { id, defaultLifts, weeks: plans, weekCount: plans.length, sessions, groups }
}
/** Number of the session (within a week) that adds a group. */
export const groupSession = (program, group) => program.weeks[0].find((s) => s.group === group)?.session ?? 1

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
 * The same program with one main lift: two sessions a week, 9 weeks, 18 sessions. Session 1 of each
 * week is 6×2 at 80%, session 2 follows the weekly steps of the table above, so the last session
 * (week 9, session 2) is the 1×1 re-test. Each session adds its own accessory group (A, B).
 */
export const RUSSIAN_MASTERS_1 = defineProgram({
  id: 'russian-masters-1',
  defaultLifts: ['squat'],
  weeks: V2.map((v2, w) => [
    { group: 'A', lifts: [{ slot: 0, ...V1 }] },
    { group: 'B', lifts: [{ slot: 0, ...v2, retest: w === V2.length - 1 }] },
  ]),
})

export const PROGRAMS = [RUSSIAN_MASTERS, RUSSIAN_MASTERS_1]
export const DEFAULT_PROGRAM = RUSSIAN_MASTERS
