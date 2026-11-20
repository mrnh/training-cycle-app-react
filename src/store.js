import {
  ALL_SESSIONS, DEFAULT_CATALOG, DEFAULT_PRIMARIES, GROUPS, finishSession, newId, secondaryKey, sessionProgress,
} from './program'
import { useSyncExternalStore } from 'react'
import { get, set, del } from 'idb-keyval'

// All app data lives in one object in IndexedDB. Every change is saved immediately.
const KEY = 'training-plan'
export const DATA_VERSION = 5
// Untouched copy of the data from before an upgrade, kept in case a conversion goes wrong
const BACKUP_KEY = (v) => `training-plan-before-v${v}`

let state // undefined = still loading, null = no data yet (first launch)
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

get(KEY)
  .then(async (v) => {
    if (!v) return (state = null)
    const upgraded = migrate(v)
    if (!upgraded) throw new Error(`Unknown data version ${v.version}`)
    if (upgraded !== v) {
      await set(BACKUP_KEY(upgraded.version), v)
      await set(KEY, upgraded)
    }
    state = upgraded
  })
  .catch((e) => {
    console.error('Could not load data', e)
    state = null
  })
  .finally(emit)

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useStore = () => useSyncExternalStore(subscribe, () => state)

export function replaceState(next) {
  state = next
  emit()
  const save = next === null ? del(KEY) : set(KEY, next)
  save.catch((e) => console.error('Could not save data', e))
}

/** Apply a mutation to a copy of the state and save it. */
export function update(mutate) {
  const draft = structuredClone(state)
  mutate(draft)
  replaceState(draft)
}

export const currentCycle = (s) => s.cycles[s.cycles.length - 1]

/** Mutate the current cycle. */
export const updateCycle = (mutate) => update((d) => mutate(currentCycle(d), d))

export function newCycle(startDate, oneRM, primaries = DEFAULT_PRIMARIES) {
  return {
    id: newId(),
    startDate,
    primaries: [...primaries], // catalog ids of the three main-lift slots
    oneRM, // catalog id -> kg, fixed for the cycle
    logs: {}, // setKey -> { w, r, done }
    notes: {}, // sessionKey, sessionKey:liftId or sessionKey:+exerciseId -> text
    setCounts: {}, // sessionKey:+exerciseId -> number of rows (secondary only)
    finished: {}, // sessionKey -> permanent record (see buildRecord in program.js)
    active: null, // the one open session: { key, startedAt }
    rest: {}, // card key (as in notes) -> rest interval in seconds
    timer: null, // the one running rest timer: { card, startedAt }
  }
}

export function initialState(startDate, oneRM) {
  return {
    version: DATA_VERSION,
    catalog: DEFAULT_CATALOG.map((e) => ({ ...e })), // [{ id, name }]
    groups: Object.fromEntries(GROUPS.map((g) => [g, []])), // group -> ordered catalog ids
    cycles: [newCycle(startDate, oneRM)],
  }
}

/**
 * Bring stored data or a backup up to the current version. Returns the same object when
 * nothing changed, and null for data this app can't read.
 */
export function migrate(data) {
  if (!data || !Array.isArray(data.cycles) || !data.cycles.length) return null
  if (data.version === 1) {
    // v1: secondary exercises carried their own group; squat/bench/deadlift were built in.
    const secondary = data.secondary.filter((e) => !DEFAULT_PRIMARIES.includes(e.id))
    const ids = new Set(secondary.map((e) => e.id))
    // Secondary sets, notes and set counts move to their own "+id" key
    const rekey = (obj = {}) =>
      Object.fromEntries(
        Object.entries(obj).map(([k, v]) => {
          const parts = k.split(':')
          if (ids.has(parts[1])) parts[1] = secondaryKey(parts[1])
          return [parts.join(':'), v]
        }),
      )
    data = {
      version: 2,
      // Only the main lifts were built in at v1; later defaults are added by the v5 step
      catalog: [...DEFAULT_CATALOG.filter((e) => DEFAULT_PRIMARIES.includes(e.id)).map((e) => ({ ...e })), ...secondary.map(({ id, name }) => ({ id, name }))],
      groups: Object.fromEntries(GROUPS.map((g) => [g, secondary.filter((e) => e.group === g).map((e) => e.id)])),
      cycles: data.cycles.map((c) => ({
        ...c,
        primaries: [...DEFAULT_PRIMARIES],
        logs: rekey(c.logs),
        notes: rekey(c.notes),
        setCounts: rekey(c.setCounts),
      })),
    }
  }
  if (data.version === 2) {
    // v3: finished sessions become permanent records. Sessions whose main-lift sets were all
    // ticked count as finished (date unknown); everything else stays a draft.
    const next = structuredClone(data)
    next.version = 3
    for (const c of next.cycles) {
      c.finished = {}
      for (const plan of ALL_SESSIONS) {
        if (sessionProgress(c, plan).complete) finishSession(next, c, plan, null)
      }
    }
    data = next
  }
  if (data.version === 3) {
    // v4: only one session is open at a time (cycle.active). Drafts from before were test data
    // and are dropped; finished sessions stay.
    data = {
      ...data,
      version: 4,
      cycles: data.cycles.map((c) => ({ ...c, logs: {}, notes: {}, setCounts: {}, active: null })),
    }
  }
  if (data.version === 4) {
    // v5: more default exercises. Added to the catalog unless one with the same name exists.
    const names = new Set(data.catalog.map((e) => e.name.trim().toLowerCase()))
    const ids = new Set(data.catalog.map((e) => e.id))
    const added = DEFAULT_CATALOG.filter((e) => !ids.has(e.id) && !names.has(e.name.toLowerCase()))
    data = { ...data, version: 5, catalog: [...data.catalog, ...added.map((e) => ({ ...e }))] }
  }
  return data.version === DATA_VERSION ? data : null
}
