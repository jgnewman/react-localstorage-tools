export type LocalStorageDefaults = Record<string, any>

export type StorageListener<T extends LocalStorageDefaults> = (
  key: keyof T,
) => void

export type KeysWithBooleanValue<T> = {
  [K in keyof T]: T[K] extends boolean ? K : never
}[keyof T]

export type GetItemStub = (key: string) => string | null
export type SetItemStub = (key: string, value: string) => void

export interface LocalStorageAPIStub {
  getItem: GetItemStub
  setItem: SetItemStub
}

export interface StorageMigrationResult {
  key: string
  value: any
}

export type StorageMigrationFunction = (value: any) => StorageMigrationResult

export interface StorageMigration {
  key: string
  mapTo: string | null | StorageMigrationFunction
}

export interface LocalStorageToolsConfig {
  apiStub?: LocalStorageAPIStub
  migrations?: StorageMigration[]
}
