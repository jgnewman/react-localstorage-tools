**react-localstorage-tools**

# Finally a decent way to integrate localStorage with modern React

React-localstorage-tools provides a suite of utilities for working with localStorage both inside and outside of the React render cycle. Stored values can be dealt with as easily as if you were working with `useState` and changes to stored values can be detected from inside and outside of your react app. Here's how it works:

First, decide on some default values for each localStorage key you'll be working with. Then, use your defaults to create a suite of localStorage tools:

```typescript
import createLocalStorageTools from 'react-localstorage-tools'

const localStorageDefaults = {
  name: 'Alex',
  age: 21,
}

const {
  // Some basic localStorage utilities
  getItem,
  setItem,

  // Some pubsub tools
  publishStorageChange,
  subscribeToStorageChange,
  unsubscribeFromStorageChange,

  // Some context tools
  StorageContext,
  StorageContextProvider,
  userStorageContext,

  // Some convenience hooks
  useStoredState,
  useStoredBoolean,
} = createLocalStorageTools(localStorageDefaults)
```

In the vast majority of cases, you will only need to work with the context tools and the hooks. The basic utilities and pubsub tools are available for those rarer cases when you need to deal with localStorage outside of the React render cycle, but still need your React app to pick up on those changes (or _vice versa_).

At this point, you can spin up a React app and start using localStorage as if it was any other kind of React state. In our example, we'll wrap our UI in the `StorageContextProvider`, which will allow us to use the `useStoredState` hook within all nested components:

```typescript
const MyComponent = () => {
  const [name, setName] = useStoredState('greeting') // Typescript knows `name` is a string!
  const [age, setAge] = useStoredState('age')        // Typescript knows `age` is a number!
  return (
    <div>
      <h1>
        Hello, my name is {name} and I am {age} years old.
      </h1>
      <input type="text" value={name} onChange={({ target }) => setName(target.value)}>
    </div>
  )
}

const App = () => {
  return (
    <StorageContextProvider>
      <MyComponent />
    </StorageContextProvider>
  )
}
```

Try it out and watch the Local Storage table in your dev tools update while you type!

> **Before you get started for real:**
>
> Keep in mind that `null` has a special meaning when dealing with localStorage. When you attempt to call `localStorage.getItem` on some key that does not exist, it returns `null`. For this reason, you are not allowed to specify any of your default values as `null`. In fact, all localStorage values must become strings at the point of actual storage, meaning that you will not be allowed to store any nullish or unserializable values at all. The values provided within your defaults object will determine which data type is allowed for each key (no switching between string and number on a single key, for example).
>
> Additionally, because we want to think about localStorage in terms of persistent application state, we don't actually want to _remove_ any values as part of the application lifecycle. For example, tools such as React's `useState` and even Redux allow updating the value of keys on the state, but do not allow deleting keys altogether because doing so could have unexpected consequences (and also annoyingly force all of our types to be nullable). For that reason, this package deliberately does not provide access to `localStorage.removeItem`. If you manually call `removeItem` on a value, TypeScript can not know this and your types will begin lying to you.

## What happens when localStorage is unavailable?

Sometimes your app renders intially on the server side. Also, users occasionally disable localStorage for various reasons. When this happens, react-localstorage-tools will continue to work as expected _mostly_. It defaults to storing all of your values in an in-memory `Map` so that everything will continue to work as expected within a single browser tab until the tab is closed or refreshed, at which point all stored values will reset back to default.

The library also provides access to a boolean called `hasLocalStorage` that will tell you whether or not localStorage is available in a given environment so that you can make decisions as necessary.

If you'd like, you can even provide your own localStorage API stub taking the following form:

```typescript
interface LocalStorageAPIStub {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

// To actually use your stub...

createLocalStorageTools(localStorageDefaults, {
  apiStub: {
    getItem: /* stub fn */,
    setItem: /* stub fn */,
  }
})
```

Your stub will be applied only in the case where no localStorage is detected. This will allow you to fall back to using sessionStorage or cookies or whatever you might want to do.

## What happens when keys get stale?

Sometimes you need to make updates to your application that involve changing the way values are stored in localStorage. It's sad to have to leave the old values sitting around unused, and a bit annoying to try and convert stale keys into fresh data that works with your new changes. For these circumstances, you can provide an array of localStorage migrations to your application that allow you to automatically map old data to new data before the rest of the system is initialized.

Migrations take the following form:

```typescript
type LocalStorageMigrations = Array<{
  key: string
  mapTo: string | null | ((value: any) => { key: string; value: any })
}>

// To actually use your migrations...

createLocalStorageTools(localStorageDefaults, {
  migrations: [
    {
      key: 'someOldKey',
      mapTo: 'someNewKey',
    },
    {
      key: 'someUndesirableKey',
      mapTo: null,
    },
    {
      key: 'someOldKeyWithTheWrongDataType',
      mapTo: (value: number) => ({
        key: 'someNewKeyWithTheRightDataType',
        value: value.toString(),
      }),
    },
  ],
})
```

Each of your migrations will be run in sequence, thus allowing you to junk up your users' localStorage to your heart's content and continue to migrate things forward infinitely. Made a new change? Just add a new migration into the list. If the new key being mapped to has a different name than the old key, the old key will be deleted after the migration runs. Mapping to `null` is the best way to say "delete this key".

Your defaults object will be used to hydrate localStorage only _after_ migrations run. This way you can map some old data to a correct, already-stored value that will not be overwritten by a default.

## API

### `hasLocalStorage`

This is a simple boolean value indicating whether or not the current environment has access to localStorage.

```typescript
import { hasLocalStorage } from 'react-localstorage-tools'

console.log(hasLocalStorage) // true | false
```

### `createLocalStorageTools`

The default export of the react-localstorage-tools package. It takes an object representing default values for all of the keys you will be working with, as well as an optional, custom localStorage stub API. All keys in your defaults object must be strings and all values must be serializable data. It generates a self-contained package of localStorage tools built specifically around your defaults object and returns them.

```typescript
import createLocalStorageTools from 'react-localstorage-tools'

const localStorageDefaults = {
  name: 'Alex',
  age: 21,
}

const tools = createLocalStorageTools(localStorageDefaults /*, stubApi */)
```

### `getItem`

```typescript
// where Defaults = typeof YOUR_DEFAULTS_OBJECT
function getItem<K extends keyof Defaults>(key: K): Defaults[K]
```

Retrieves and automatically de-serializes a value from localStorage by key name.

### `setItem`

```typescript
// where Defaults = typeof YOUR_DEFAULTS_OBJECT
function setItem<K extends keyof Defaults>(key: K, val: Defaults[K]): void
```

Automatically serializes and stores a value in localStorage. Also publishes a change event that can be observed via `subscribeToStorageChange`.

### `publishStorageChange`

```typescript
// where Defaults = typeof YOUR_DEFAULTS_OBJECT
function publishStorageChange(key: keyof Defaults): void
```

Alerts all subscribers to the fact that a change has occurred, calling each one with the provided `key`. Subscribers can be created via `subscribeToStorageChange`.

### `subscribeToStorageChange`

```typescript
// where Defaults = typeof YOUR_DEFAULTS_OBJECT
function subscribeToStorageChange(listener: (key: keyof Defaults) => void): void
```

Registers a listener function that will be called whenever a localStorage value is changed. The listener receives the key whose value was changed. Changes can be published to all listeners via `publishStorageChange`.

### `unsubscribeFromStorageChange`

```typescript
// where Defaults = typeof YOUR_DEFAULTS_OBJECT
function unsubscribeFromStorageChange(
  listener: (key: keyof Defaults) => void,
): void
```

Unregisters a listener that was registered via `subscribeToStorageChange`.

### `storageContext`

This is a React context object that can be used with `React.useContext`. It provides access to two useful functions.

```typescript
const { getStoredState, setStoredState } = React.useContext(storageContext)
```

#### `getStoredState`

```typescript
// where Defaults = typeof YOUR_DEFAULTS_OBJECT
function getStoredState<K extends keyof Defaults>(key: K): Defaults[K]

const { getStoredState } = React.useContext(storageContext)
const name = getStoredState('name')
```

Provides access to a stored value by key. The value is automatically deserialized as necessary when retrieved. Whenever a change occurs in localStorage, your component will automatically re-render with the correct value.

#### `setStoredState`

```typescript
// where Defaults = typeof YOUR_DEFAULTS_OBJECT
function setStoredState<K extends keyof Defaults>(
  key: K,
  val: Defaults[K],
): void

const { setStoredState } = React.useContext(storageContext)
const handleClickSubmit = () => setStoredState('name', 'Bill')
```

Allows you to update a stored value, which will be automatically serialized for you when stored. Calling this automatically triggers a re-render for all components using the `storageContext` so that they can receive the proper, updated value.

### `useStorageContext`

This is a convenience hook that allows access to the `storageContext` value and throws a helpful error if you try to use it outside the scope of the context.

```typescript
const { getStoredState, setStoredState } = useStorageContext()
```

See `storageContext` for more information.

### `useStoredState`

```typescript
// where Defaults = typeof YOUR_DEFAULTS_OBJECT
function useStoredState<K extends keyof Defaults, V extends Defaults[K]>(
  key: K,
): [V, (val: V) => void]

const [name, setName] = useStoredState('name')
// [string, (val: string) => void]
```

A hook providing you with quick access via context to a particular localStorage value by key. It returns an array containing the deserialized current value and a function for updating the value. Setting the value will trigger re-renders as expected such that any components depending on the localStorage context will update automatically with proper values.

### `useStoredBoolean`

```typescript
// where BooleanKeys is a union of all keys in the defaults object with boolean values
function useStoredBoolean<K extends BooleanKeys>(
  key: K,
): [boolean, VoidFunction, VoidFunction]

const [bool, setTrue, setFalse] = useStoredBoolean('myBooleanKey')
// boolean, () => void, () => void
```

A hook providing you with quick access via context to a particual boolean localStorage value by key. It returns an array containing the current boolean value, a function for setting the value to true, and a function for setting the value to false. Updating the value will trigger re-renders as expected such that any components depending on the localStorage context will update automatically with proper values.
