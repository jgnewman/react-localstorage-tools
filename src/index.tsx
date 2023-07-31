import type {
  LocalStorageDefaults,
  StorageListener,
  StorageChange,
  KeysWithBooleanValue,
  LocalStorageAPIStub,
} from 'types'
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  hasLocalStorage,
  safeGetFromStorage,
  safeSetInStorage,
  safeRemoveFromStorage,
} from 'stubs'

export { hasLocalStorage } from 'stubs'

/**
 * Safely attempts to parse any value. This is important because we are running
 * JSON.stringify on every value we put into localStorage. This means we could end up
 * with strings that look like this for exampe: '"foo"'
 *
 * This function can take the following values and return them all correctly:
 * '"foo"' -> "foo"
 * "foo" -> "foo"
 * { bar: "foo" } -> { bar: "foo" }
 * '{ "bar": "foo" }' -> { bar: "foo" }
 * ["foo"] -> ["foo"]
 * '["foo"]' -> ["foo"]
 * etc...
 *
 * Also works as expected with numbers and other values like null or undefined.
 * "4" -> 4
 * 4 -> 4
 * etc...
 */
const safeParse = <T,>(value: any): T => {
  try {
    const json = `{ "value": ${value} }`
    return JSON.parse(json).value as T
  } catch (_) {
    return value as T
  }
}

const createLocalStorageTools = <T extends LocalStorageDefaults>(
  defaults: T,
  apiStub?: LocalStorageAPIStub,
) => {
  type Getter = <K extends keyof T>(key: K) => T[K]
  type NullableGetter = <K extends keyof T>(key: K) => T[K] | null
  type Setter = <K extends keyof T>(key: K, val: T[K]) => void
  type Remover = <K extends keyof T>(key: K) => void

  type StorageContextTools = {
    getStoredState: NullableGetter
    setStoredState: Setter
    removeStoredState: Remover
  }

  type BooleanKeys = KeysWithBooleanValue<T>

  /**
   * Initial setup:
   * - Prove that all keys in defaults are strings
   * - Pick our API functions (stubbed or not)
   * - Hydrate localStorage with defaults
   */

  const allDefaultKeysAreStrings = Reflect.ownKeys(defaults).every(
    (k) => typeof k === 'string',
  )

  if (!allDefaultKeysAreStrings) {
    throw new Error(
      'All keys in the localStorage defaults object must be strings.',
    )
  }

  const safeGetItem =
    (!hasLocalStorage && apiStub?.getItem) || safeGetFromStorage
  const safeSetItem = (!hasLocalStorage && apiStub?.setItem) || safeSetInStorage
  const safeRemoveItem =
    (!hasLocalStorage && apiStub?.removeItem) || safeRemoveFromStorage

  try {
    Object.entries(defaults).forEach(([storageKey, defaultVal]) => {
      if (defaultVal === null) {
        throw new Error(
          `Default value for \`${storageKey}\` cannot be null. Retrieving a null value from localStorage indicates the key does not exist.`,
        )
      }
      const existingVal = safeGetItem(storageKey)
      if (existingVal === null) {
        safeSetItem(storageKey, JSON.stringify(defaultVal))
      }
    })
  } catch (_) {}

  /** PubSub tools */

  let listeners: StorageListener<T>[] = []

  const publishStorageChange = (key: keyof T, change: StorageChange) => {
    listeners.forEach((listener) => listener(key, change))
  }

  const subscribeToStorageChange = (listener: StorageListener<T>) => {
    listeners.push(listener)
  }

  const unsubscribeFromStorageChange = (listener: StorageListener<T>) => {
    listeners = listeners.filter((l) => l !== listener)
  }

  /** Raw storage manipulators */

  const getItem: NullableGetter = <K extends keyof T>(key: K) => {
    try {
      const val = safeGetItem(key as string)
      return val === null ? null : (safeParse(val) as T[K])
    } catch (_) {
      return null
    }
  }

  const setItem: Setter = (key, val) => {
    try {
      safeSetItem(key as string, JSON.stringify(val))
      publishStorageChange(key, 'SET')
    } catch (_) {}
  }

  const removeItem: Remover = (key) => {
    try {
      safeRemoveItem(key as string)
      publishStorageChange(key, 'REMOVE')
    } catch (_) {}
  }

  /** Context tools */

  const initialContext: StorageContextTools = {
    getStoredState: () => null,
    setStoredState: () => undefined,
    removeStoredState: () => undefined,
  }

  const StorageContext = createContext<StorageContextTools>(initialContext)

  const useStorageContext = () => {
    const context = useContext(StorageContext)
    if (!context) throw new Error('Storage context not available')
    return context
  }

  const StorageContextProvider = ({ children }: { children: ReactNode }) => {
    const [lastUpdatedKey, triggerRender] = useState({ key: '' })

    // We can safely use ! on getItem because defaults are stored on mount
    // and we are locked into working only with keys provided in the defaults.
    const getStoredState: Getter = useCallback((k) => getItem(k)!, [])
    const setStoredState: Setter = useCallback((k, v) => setItem(k, v), [])
    const removeStoredState: Remover = useCallback((k) => removeItem(k), [])

    useEffect(() => {
      const listener: StorageListener<T> = <K extends keyof T>(key: K) => {
        triggerRender({ key: key as string })
      }
      subscribeToStorageChange(listener)
      return () => unsubscribeFromStorageChange(listener)
    }, [])

    const tools = useMemo(
      () => ({
        // This value exists on the object in order to make sure a new tools object is
        // created when a new storage value is set, thereby getting components using
        // this context to actually re-render.
        lastUpdatedKey,
        getStoredState,
        setStoredState,
        removeStoredState,
      }),
      [getStoredState, removeStoredState, setStoredState, lastUpdatedKey],
    )

    return (
      <StorageContext.Provider value={tools}>
        {children}
      </StorageContext.Provider>
    )
  }

  /** Hooks */

  const useStoredState = <K extends keyof T, V extends T[K]>(
    key: K,
  ): [V, (val: V) => void, VoidFunction] => {
    const { getStoredState, setStoredState, removeStoredState } =
      useStorageContext()

    const value = getStoredState(key)

    if (value === null) {
      throw new Error(
        `No value found for localStorage key: \`${
          key as string
        }\`. Did you forget to provide a default value?`,
      )
    }

    const setValue = useCallback(
      (value: V) => setStoredState(key, value),
      [key, setStoredState],
    )

    const removeValue = useCallback(
      () => removeStoredState(key),
      [key, removeStoredState],
    )

    return [value, setValue, removeValue]
  }

  const useStoredBoolean = <K extends BooleanKeys>(
    key: K,
  ): [boolean, VoidFunction, VoidFunction] => {
    if (typeof defaults[key] !== 'boolean') {
      throw new Error(
        `Cannot use \`useStoredBoolean\` with key \`${
          key as string
        }\` which is not a boolean.`,
      )
    }
    const [value, setValue] = useStoredState<K, any>(key)
    const setTrue = useCallback(() => setValue(true), [setValue])
    const setFalse = useCallback(() => setValue(false), [setValue])
    return [value as boolean, setTrue, setFalse]
  }

  return {
    publishStorageChange,
    subscribeToStorageChange,
    unsubscribeFromStorageChange,
    getItem,
    setItem,
    removeItem,
    StorageContext,
    StorageContextProvider,
    useStorageContext,
    useStoredState,
    useStoredBoolean,
  }
}

export default createLocalStorageTools
