import { useCallback } from 'react'
import { StorageContextPackage } from 'createStorageContext'

export interface StorageHooksPackage<K extends string> {
  useStoredState: <T>(key: K) => [T, (val: T) => void, VoidFunction]
  useStoredBoolean: (key: K) => [boolean, VoidFunction, VoidFunction]
}

const createHooks = <K extends string>({
  useStorageContext,
}: StorageContextPackage<K>) => {
  const useStoredState = <T>(key: K): [T, (val: T) => void, VoidFunction] => {
    const { getStoredState, setStoredState, removeStoredState } =
      useStorageContext()

    const value = getStoredState<T>(key)
    if (value === null) {
      throw new Error(
        `No value found for localStorage key: \`${key}\`. Did you forget to pass a default to the Provider?`,
      )
    }

    const setValue = useCallback(
      <T>(value: T) => setStoredState(key, value),
      [key, setStoredState],
    )
    const removeValue = useCallback(
      () => removeStoredState(key),
      [key, removeStoredState],
    )

    return [value, setValue, removeValue]
  }

  const useStoredBoolean = (key: K): [boolean, VoidFunction, VoidFunction] => {
    const [value, setValue] = useStoredState<boolean>(key)
    const setTrue = useCallback(() => setValue(true), [setValue])
    const setFalse = useCallback(() => setValue(false), [setValue])
    return [value, setTrue, setFalse]
  }

  return { useStoredState, useStoredBoolean }
}

export default createHooks
