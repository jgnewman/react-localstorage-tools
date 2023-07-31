const nativeStorage = window.localStorage

class LocalStorageProxy {
  private enabled: boolean = true

  private errorWhenDisabled() {
    if (!this.enabled) {
      throw new Error('localStorage is disabled')
    }
  }

  get length() {
    this.errorWhenDisabled()
    return nativeStorage.length
  }

  key(key: number) {
    this.errorWhenDisabled()
    return nativeStorage.key(key)
  }

  clear() {
    this.errorWhenDisabled()
    return nativeStorage.clear()
  }

  getItem(key: string) {
    this.errorWhenDisabled()
    return nativeStorage.getItem(key)
  }

  setItem(key: string, value: string) {
    this.errorWhenDisabled()
    return nativeStorage.setItem(key, value)
  }

  removeItem(key: string) {
    this.errorWhenDisabled()
    return nativeStorage.removeItem(key)
  }

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
  }
}

const proxyStorage = new LocalStorageProxy()

Object.defineProperty(window, 'localStorage', { value: proxyStorage })

export { nativeStorage, proxyStorage }
