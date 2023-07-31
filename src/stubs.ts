import type { GetItemStub, SetItemStub } from 'types'

/**
 * Old versions of webkit don't allow access to localStorage in private mode.
 * This was fixed but there are still various ways a user can disable localStorage.
 *
 * https://bugs.webkit.org/show_bug.cgi?id=157010
 */
const testLocalStorage = () => {
  if (typeof window === 'undefined') return false
  const now = Date.now()
  try {
    window.localStorage.setItem(now + '_local_storage_test', '1')
    window.localStorage.removeItem(now + '_local_storage_test')
    return true
  } catch (e) {
    return false
  }
}

export const hasLocalStorage = testLocalStorage()

const storageStub = new Map<string, any>()

export const safeGetFromStorage: GetItemStub = (key) => {
  return hasLocalStorage
    ? window.localStorage.getItem(key) ?? null
    : storageStub.get(key) ?? null
}

export const safeSetInStorage: SetItemStub = (key, value) => {
  hasLocalStorage
    ? window.localStorage.setItem(key, value)
    : storageStub.set(key, value)
}
