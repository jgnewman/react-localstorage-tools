import createHooks, { StorageHooksPackage } from 'createHooks'
import createPubSub, { StoragePubSubPackage } from 'createPubSub'
import createStorageContext, {
  LocalStorageDefaults,
  StorageContextPackage,
} from 'createStorageContext'
import createUtils, { StorageUtilsPackage } from 'createUtils'

export type LocalStorageTools<K extends string> = StoragePubSubPackage<K> &
  StorageUtilsPackage<K> &
  StorageContextPackage<K> &
  StorageHooksPackage<K>

const createLocalStorageTools = <K extends string>(
  defaults: LocalStorageDefaults<K>,
): LocalStorageTools<K> => {
  const pubSub = createPubSub<K>()
  const utils = createUtils<K>(pubSub)
  const context = createStorageContext<K>(defaults, pubSub, utils)
  const hooks = createHooks<K>(context)

  return {
    ...pubSub,
    ...utils,
    ...context,
    ...hooks,
  }
}

export default createLocalStorageTools
