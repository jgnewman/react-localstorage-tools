import React from 'react'
import { createRoot } from 'react-dom/client'
import createLocalStorageTools from '../src'

// TODO: Add a test suite

const localStorageDefaults = {
  name: 'Alex',
  age: 500,
  testBool: true,
}

const { StorageContextProvider, useStoredState, useStoredBoolean, setItem } =
  createLocalStorageTools(localStorageDefaults, {
    migrations: [
      {
        key: 'someOldStorageKey',
        mapTo: null,
      },
    ],
  })

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
