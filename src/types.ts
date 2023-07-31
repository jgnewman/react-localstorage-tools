export type LocalStorageDefaults = Record<string, any>

export type StorageChange = 'SET' | 'REMOVE'

export type StorageListener<T extends LocalStorageDefaults> = (
  key: keyof T,
  change?: StorageChange,
) => void

export type KeysWithBooleanValue<T> = {
  [K in keyof T]: T[K] extends boolean ? K : never
}[keyof T]

export type GetItemStub = (key: string) => string | null
export type SetItemStub = (key: string, value: string) => void
export type RemoveItemStub = (key: string) => void

export interface LocalStorageAPIStub {
  getItem: GetItemStub
  setItem: SetItemStub
  removeItem: RemoveItemStub
}
