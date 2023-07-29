import type { StoragePubSubPackage } from 'createPubSub'
import hasLocalStorage from 'hasLocalStorage'
import safeParse from 'safeParse'

export interface StorageUtilsPackage<K extends string> {
  getItem: <T>(key: K) => T | null
  setItem: <T>(key: K, val: T) => void
  removeItem: (key: K) => void
}

const isNullish = (val: any) => val === null || val === undefined

const createUtils = <K extends string>({
  publishStorageChange,
}: StoragePubSubPackage<K>): StorageUtilsPackage<K> => {
  return {
    getItem: <T>(key: K) => {
      if (!hasLocalStorage) return null
      try {
        const val = window.localStorage.getItem(key)
        if (isNullish(val)) return null
        const parsedVal: T = safeParse(val)
        return parsedVal
      } catch (_) {
        return null
      }
    },

    setItem: <T>(key: K, val: T) => {
      if (!hasLocalStorage) return
      try {
        window.localStorage.setItem(key, JSON.stringify(val))
        publishStorageChange(key, 'SET')
      } catch (_) {}
    },

    removeItem: (key: K) => {
      if (!hasLocalStorage) return
      try {
        window.localStorage.removeItem(key)
        publishStorageChange(key, 'REMOVE')
      } catch (_) {}
    },
  }
}

export default createUtils
