import React from 'react'
import { createRoot } from 'react-dom/client'
import createLocalStorageTools from '../src'

// TODO: Is there a way to narrow reactivity such that we only re-render when the value of specific
// keys we care about change?

// TODO: We are claiming that values will always exist because we have provided defaults. However,
// if at any point we call removeItem, then the value will be null. This means we either need to
// accept that all values are nullable, or we need to stop providing access to removeItem.

// TODO: Add a test suite

const localStorageDefaults = {
  name: 'Alex',
  age: 500,
  testBool: true,
}

const { StorageContextProvider, useStoredState, useStoredBoolean, setItem } =
  createLocalStorageTools(localStorageDefaults)

// @ts-ignore
window.setItem = setItem

const View = () => {
  const [name, setName] = useStoredState('name')
  const [age] = useStoredState('age')
  const [testBool] = useStoredBoolean('testBool')
  return (
    <div>
      <h1>
        Hello, my name is {name} and I am {age} years old. This is{' '}
        {`${testBool}`}.
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
