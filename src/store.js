import { newId } from './program'
import { useSyncExternalStore } from 'react'
import { get, set, del } from 'idb-keyval'

// All app data lives in one object in IndexedDB. Every change is saved immediately.
const KEY = 'training-plan'
export const DATA_VERSION = 1

let state // undefined = still loading, null = no data yet (first launch)
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

get(KEY)
  .then((v) => (state = v ?? null))
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

export function newCycle(startDate, oneRM) {
  return {
    id: newId(),
    startDate,
    oneRM, // { squat, bench, deadlift } — fixed for the cycle
    logs: {}, // setKey -> { w, r, done }
    notes: {}, // sessionKey or sessionKey:exerciseId -> text
    setCounts: {}, // sessionKey:exerciseId -> number of rows (secondary only)
  }
}

export function initialState(startDate, oneRM) {
  return { version: DATA_VERSION, secondary: [], cycles: [newCycle(startDate, oneRM)] }
}
