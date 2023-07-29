import type { StoragePubSubPackage, StorageListener } from 'createPubSub'
import type { StorageUtilsPackage } from 'createUtils'
import React, {
  Context,
  JSX,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import hasLocalStorage from 'hasLocalStorage'

export type LocalStorageDefaults<K extends string> = Record<K, any>

export interface StorageContextTools<K extends string> {
  getStoredState: <T>(key: K) => T | null
  setStoredState: <T>(key: K, value: T) => void
  removeStoredState: (key: K) => void
}

export interface StorageContextProviderProps {
  children: ReactNode
}

export interface StorageContextPackage<K extends string> {
  StorageContext: Context<StorageContextTools<K>>
  StorageContextProvider: (p: StorageContextProviderProps) => JSX.Element
  useStorageContext: () => StorageContextTools<K>
}

const createStorageContext = <K extends string>(
  defaults: LocalStorageDefaults<K>,
  {
    subscribeToStorageChange,
    unsubscribeFromStorageChange,
  }: StoragePubSubPackage<K>,
  { getItem, setItem, removeItem }: StorageUtilsPackage<K>,
): StorageContextPackage<K> => {
  const initialContext: StorageContextTools<K> = {
    getStoredState: () => null,
    setStoredState: () => undefined,
    removeStoredState: () => undefined,
  }

  const StorageContext = createContext<StorageContextTools<K>>(initialContext)

  const useStorageContext = () => {
    const context = useContext(StorageContext)
    if (!context) throw new Error('Storage context not available')
    return context
  }

  const StorageContextProvider = ({ children }: { children: ReactNode }) => {
    const [value, triggerRender] = useState({ key: '' })
    const defaultsRef = useRef(defaults)
    const defaultsStoredRef = useRef(false)

    const getStoredState = useCallback(<T,>(key: K) => getItem<T>(key), [])
    const setStoredState = useCallback(
      <T,>(key: K, val: T) => setItem<T>(key, val),
      [],
    )
    const removeStoredState = useCallback((key: K) => removeItem(key), [])

    useEffect(() => {
      const listener: StorageListener = (key) => triggerRender({ key })
      subscribeToStorageChange(listener)
      return () => unsubscribeFromStorageChange(listener)
    }, [])

    const storeDefaults = useCallback(() => {
      const { current: defaults } = defaultsRef
      if (!hasLocalStorage || !defaults) return
      try {
        Object.entries(defaults).forEach(([storageKey, defaultVal]) => {
          const existingVal = getStoredState(storageKey as K)
          if (existingVal === null && defaultVal !== null) {
            window.localStorage.setItem(storageKey, JSON.stringify(defaultVal))
          }
        })
      } catch (_) {}
    }, [defaultsRef, getStoredState])

    if (!defaultsStoredRef.current) {
      storeDefaults()
      defaultsStoredRef.current = true
    }

    const tools = useMemo(
      () => ({
        // This value exists on the object in order to make sure a new tools object is
        // created when a new storage value is set, thereby getting components using
        // this context to actually re-render.
        lastUpdatedKey: value,
        getStoredState,
        setStoredState,
        removeStoredState,
      }),
      [getStoredState, removeStoredState, setStoredState, value],
    )

    return (
      <StorageContext.Provider value={tools}>
        {children}
      </StorageContext.Provider>
    )
  }

  return {
    StorageContext,
    StorageContextProvider,
    useStorageContext,
  }
}

export default createStorageContext
