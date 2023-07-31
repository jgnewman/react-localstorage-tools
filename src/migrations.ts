import safeParse from 'safeParse'
import { hasLocalStorage } from 'stubs'
import { StorageMigration } from 'types'

const migrateStorage = (migrations: StorageMigration[]) => {
  if (!hasLocalStorage) return
  migrations.forEach(({ key, mapTo }) => {
    const value = window.localStorage.getItem(key)

    switch (typeof mapTo) {
      case 'string': {
        value !== null && window.localStorage.setItem(mapTo, value)
        window.localStorage.removeItem(key)
        break
      }

      case 'function': {
        const parsedValue = safeParse(value)
        const { key: newKey, value: newValue } = mapTo(parsedValue)
        if (newValue !== null && newValue !== undefined) {
          window.localStorage.setItem(newKey, JSON.stringify(newValue))
        }
        key !== newKey && window.localStorage.removeItem(key)
        break
      }

      // Mapping to null means we want to delete the key from localStorage
      default: {
        window.localStorage.removeItem(key)
      }
    }
  })
}

export default migrateStorage
