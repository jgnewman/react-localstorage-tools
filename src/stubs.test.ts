import { nativeStorage, proxyStorage } from 'storageProxy'
import { safeGetFromStorage, testLocalStorage } from './stubs'

describe('stubs', () => {
  beforeEach(() => {
    proxyStorage.enable()
    proxyStorage.clear()
  })

  afterAll(() => {
    proxyStorage.enable()
    proxyStorage.clear()
  })

  describe('testLocalStorage', () => {
    it('correctly determines when localStorage is available', () => {
      proxyStorage.disable()
      expect(testLocalStorage()).toBe(false)

      proxyStorage.enable()
      expect(testLocalStorage()).toBe(true)
    })
  })

  describe('safeGetFromStorage', () => {
    it('proxies to localStorage when available', () => {
      nativeStorage.setItem('foo', 'bar')
      expect(safeGetFromStorage('foo')).toBe('bar')
    })

    it('still works when localStorage is unavailable', () => {
      // proxyStorage.disable()
      // nativeStorage.setItem('foo', 'bar')
      // expect(safeGetFromStorage('foo')).toBe(null)
    })
  })

  describe('safeSetInStorage', () => {
    it('proxies to localStorage when available', () => {})

    it('still works when localStorage is unavailable', () => {})
  })
})
