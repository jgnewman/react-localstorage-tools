import React from 'react'
import { createRoot } from 'react-dom/client'
import createLocalStorageTools from '../src'

// TODO: What if access to localStorage is disabled? Do we really want users to be able to
// guarantee a return type of a hook like `useStoredState`?

// TODO: Why are we collapsing undefined and null? Shouldn't we use `undefined` as a value
// meaning "this key does not exist" and null as a valid stored value?

// TODO: Is there a way that by doing `useStoredState(key)` we could infer the value type of the key?
// I suppose that would only be true if the key was never an "|" type, since we'd have to infer from
// the initial value placed on the default.

// TODO: Is there a way to narrow reactivity such that we only re-render when the value of specific
// keys we care about change?

const localStorageDefaults = {
  name: 'Alex',
  age: 500,
}

const { StorageContextProvider, useStoredState, setItem } =
  createLocalStorageTools(localStorageDefaults)

// @ts-ignore
window.setItem = setItem

const View = () => {
  const [name, setName] = useStoredState<string>('name')
  const [age] = useStoredState<number>('age')
  return (
    <div>
      <h1>
        Hello, my name is {name} and I am {age} years old.
      </h1>
      <input
        type="text"
        value={name}
        onChange={({ target }) => setName(target.value)}></input>
    </div>
  )
}

const App = () => {
  return (
    <StorageContextProvider>
      <View />
    </StorageContextProvider>
  )
}

const rootElem = document.querySelector('#root')
if (!rootElem) throw new Error('No root elem!')

createRoot(rootElem).render(<App />)
