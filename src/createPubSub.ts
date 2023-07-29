export type StorageChange = 'SET' | 'REMOVE'
export type StorageListener = <K extends string>(
  key: K,
  change?: StorageChange,
) => void

export interface StoragePubSubPackage<K extends string> {
  publishStorageChange: (key: K, change: StorageChange) => void
  subscribeToStorageChange: (listener: StorageListener) => void
  unsubscribeFromStorageChange: (listener: StorageListener) => void
}

const createPubSub = <K extends string>(): StoragePubSubPackage<K> => {
  let listeners: StorageListener[] = []

  return {
    publishStorageChange: (key: K, change: StorageChange) => {
      listeners.forEach((listener) => listener(key, change))
    },

    subscribeToStorageChange: (listener: StorageListener) => {
      listeners.push(listener)
    },

    unsubscribeFromStorageChange: (listener: StorageListener) => {
      listeners = listeners.filter((l) => l !== listener)
    },
  }
}

export default createPubSub
