import type {
  LocalStorageDefaults,
  StorageListener,
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
import { hasLocalStorage, safeGetFromStorage, safeSetInStorage } from 'stubs'

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
  type Setter = <K extends keyof T>(key: K, val: T[K]) => void
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

  Object.entries(defaults).forEach(([storageKey, defaultVal]) => {
    if (defaultVal === null) {
      throw new Error(
        `Default value for \`${storageKey}\` cannot be null. Retrieving a null value from localStorage indicates the key does not exist.`,
      )
    }
    try {
      const existingVal = safeGetItem(storageKey)
      if (existingVal === null) {
        safeSetItem(storageKey, JSON.stringify(defaultVal))
      }
    } catch (_) {
      throw new Error(
        `Failed to hydrate localStorage key \`${storageKey}\`. Did you provide a broken stub API?`,
      )
    }
  })

  /** PubSub tools */

  let listeners: StorageListener<T>[] = []

  const publishStorageChange = (key: keyof T) => {
    listeners.forEach((listener) => listener(key))
  }

  const subscribeToStorageChange = (listener: StorageListener<T>) => {
    listeners.push(listener)
  }

  const unsubscribeFromStorageChange = (listener: StorageListener<T>) => {
    listeners = listeners.filter((l) => l !== listener)
  }

  /** Raw storage manipulators */

  const getItem: Getter = <K extends keyof T>(key: K) => {
    let val: string | null
    try {
      val = safeGetItem(key as string)
    } catch (_) {
      throw new Error(
        `The key \`${
          key as string
        }\` was irretrievable. Did you provide a broken stub API?`,
      )
    }
    if (val === null) {
      throw new Error(
        `The \`${
          key as string
        }\` key does not exist. You may have manually deleted it or forgotten to provide a default value.`,
      )
    }
    try {
      return safeParse(val) as T[K]
    } catch (_) {
      throw new Error(
        `The key \`${
          key as string
        }\` was unserializable. It may have been corrupted.`,
      )
    }
  }

  const setItem: Setter = (key, val) => {
    try {
      safeSetItem(key as string, JSON.stringify(val))
      publishStorageChange(key)
    } catch (_) {}
  }

  /** Context tools */

  const initialContext = {
    getStoredState: getItem,
    setStoredState: setItem,
  }

  const StorageContext = createContext(initialContext)

  const useStorageContext = () => {
    const context = useContext(StorageContext)
    if (!context) throw new Error('Storage context not available')
    return context
  }

  const StorageContextProvider = ({ children }: { children: ReactNode }) => {
    const [lastUpdatedKey, triggerRender] = useState({ key: '' })

    useEffect(() => {
      const listener: StorageListener<T> = <K extends keyof T>(key: K) => {
        triggerRender({ key: key as string })
      }
      subscribeToStorageChange(listener)
      return () => unsubscribeFromStorageChange(listener)
    }, [])

    // The lastUpdatedKey exists on the object in order to make sure a new tools
    // object is created when a new storage value is set, thereby getting components
    // using this context to actually re-render.
    const tools = useMemo(
      () => ({ ...initialContext, lastUpdatedKey }),
      [lastUpdatedKey],
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
  ): [V, (val: V) => void] => {
    const { getStoredState, setStoredState } = useStorageContext()
    const value = getStoredState(key)

    const setValue = useCallback(
      (value: V) => setStoredState(key, value),
      [key, setStoredState],
    )

    return [value, setValue]
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
    StorageContext,
    StorageContextProvider,
    useStorageContext,
    useStoredState,
    useStoredBoolean,
  }
}

export default createLocalStorageTools
