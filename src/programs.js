/*
 * Training programs, as plain data. A program is a table of weeks, each with its sessions; the
 * rest of the app reads the plan only through the helpers in program.js (sessionsOf, sessionPlan,
 * ...), so it never assumes a number of weeks, sessions per week or main lifts.
 *
 * Definition (see defineProgram):
 *   id            stored on every cycle ("cycle.program")
 *   name          shown to the user
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

function defineProgram({ id, name, defaultLifts, weeks }) {
  const plans = weeks.map((sessions, w) =>
    sessions.map((s, i) => ({
      week: w + 1,
      session: i + 1,
      key: sessionKey(w + 1, i + 1),
      group: s.group,
      primaries: s.lifts.map((l) => ({ retest: false, ...l })),
    })),
  )
  return { id, name, defaultLifts, weeks: plans, weekCount: plans.length, sessions: plans.flat() }
}

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
  name: 'Russian Masters Program (3 main lifts)',
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

export const PROGRAMS = [RUSSIAN_MASTERS]
export const DEFAULT_PROGRAM = RUSSIAN_MASTERS
