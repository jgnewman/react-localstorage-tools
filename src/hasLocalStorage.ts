/**
 * Old versions of webkit don't allow access to localStorage in private mode. This was fixed.
 *
 * https://bugs.webkit.org/show_bug.cgi?id=157010
 */
const testLocalStorage = () => {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem('_local_storage_test', '1')
    window.localStorage.removeItem('_local_storage_test')
    return true
  } catch (e) {
    return false
  }
}

const hasLocalStorage = testLocalStorage()
export default hasLocalStorage
