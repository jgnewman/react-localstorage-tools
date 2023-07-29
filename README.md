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
  removeItem,

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

At this point, you can spin up a React app and start using localStorage as if it was any other kind of React state:

```typescript
const MyComponent = () => {
  const [name, setName] = useStoredState<string>('greeting')
  const [age, setAge] = useStoredState<number>('age')
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
