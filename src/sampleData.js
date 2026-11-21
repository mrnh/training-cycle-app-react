import { DATA_VERSION } from './store'
import { DEFAULT_CATALOG, newId } from './program'

/*
 * Sample data for trying the app out (Settings → Use sample data): a cycle in its second week
 * with four finished sessions and Session 2.2 in progress today. Dates are relative to today.
 */

const isoDay = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const plusDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

const all = (n) => Array(n).fill(true)
const main = (exerciseId, name, sets, reps, weight, note) => ({
  kind: 'main', exerciseId, name, sets, reps, pct: 80, retest: false, planned: weight, weight, done: all(sets), rest: 120,
  ...(note && { note }),
})
const accessory = (exerciseId, name, sets, reps, weight, rest) => ({
  kind: 'secondary', exerciseId, name, prescription: { sets, reps, weight },
  sets: Array.from({ length: sets }, () => ({ w: weight, r: reps, done: true })), rest,
})
const groupA = () => [accessory('overhead-press', 'Overhead Press', 3, 8, 40, 90), accessory('pullups', 'Pullups', 3, 8, 0, 120)]
const groupB = () => [accessory('dips', 'Dips', 3, 10, 0, 90), accessory('seal-rows', 'Seal Rows', 3, 10, 30, 90)]
const groupC = () => [accessory('bulgarian-split-squat', 'Bulgarian Split Squat', 3, 8, 20, 90), accessory('nordic-curls', 'Nordic Curls', 3, 5, 0, 120)]

/** Full app state; `keep` carries over the viewer's preferences (unit, date format). */
export function sampleState(keep = {}, now = new Date()) {
  // Session 2.2 is planned for day 9 (Wednesday of week 2), so the cycle started 9 days ago
  const start = plusDays(now, -9)
  const day = (n) => isoDay(plusDays(start, n))
  const set = (w, r, done = true) => ({ w, r, done })

  return {
    version: DATA_VERSION,
    ...(keep.unit && { unit: keep.unit }),
    ...(keep.dateFormat && { dateFormat: keep.dateFormat }),
    catalog: DEFAULT_CATALOG.map((e) => ({ ...e })),
    groups: {
      A: [{ id: 'overhead-press', sets: 3, reps: 8, weight: 40, rest: 90 }, { id: 'pullups', sets: 3, reps: 8, weight: 0, rest: 120 }],
      B: [{ id: 'dips', sets: 3, reps: 10, weight: 0, rest: 90 }, { id: 'seal-rows', sets: 3, reps: 10, weight: 30, rest: 90 }],
      C: [{ id: 'bulgarian-split-squat', sets: 3, reps: 8, weight: 20, rest: 90 }, { id: 'nordic-curls', sets: 3, reps: 5, weight: 0, rest: 120 }],
    },
    cycles: [
      {
        id: newId(),
        startDate: day(0),
        primaries: ['squat', 'bench', 'deadlift'],
        oneRM: { squat: 140, bench: 100, deadlift: 180 },
        // Session 2.2 so far: four of six sets on both main lifts, two sets of dips, one seal-rows set
        logs: {
          ...Object.fromEntries([0, 1, 2, 3].flatMap((i) => [[`w2s2:bench:${i}`, set(80, 4)], [`w2s2:squat:${i}`, set(112, 2)]])),
          'w2s2:+dips:0': set(0, 10),
          'w2s2:+dips:1': set(0, 10),
          'w2s2:+seal-rows:0': set(32.5, 10),
        },
        notes: {},
        setCounts: {},
        finished: {
          w1s1: {
            finishedAt: day(0), group: 'A',
            entries: [main('squat', 'Squat', 6, 3, 112, 'Felt heavy today, knees a bit sore.\nBelt on from set 3.'), main('deadlift', 'Deadlift', 6, 2, 144), ...groupA()],
          },
          w1s2: { finishedAt: day(2), group: 'B', entries: [main('bench', 'Bench press', 6, 3, 80), main('squat', 'Squat', 6, 2, 112), ...groupB()] },
          w1s3: { finishedAt: day(4), group: 'C', entries: [main('deadlift', 'Deadlift', 6, 3, 144), main('bench', 'Bench press', 6, 2, 80), ...groupC()] },
          w2s1: { finishedAt: day(7), group: 'A', entries: [main('squat', 'Squat', 6, 4, 112), main('deadlift', 'Deadlift', 6, 2, 144), ...groupA()] },
        },
        active: { key: 'w2s2', startedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString() },
        rest: {},
        timer: null,
      },
    ],
  }
}
