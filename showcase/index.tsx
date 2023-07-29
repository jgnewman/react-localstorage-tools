import React from 'react'
import { createRoot } from 'react-dom/client'

const App = () => {
  return (
    <div>Hello, world!</div>
  )
}

const rootElem = document.querySelector('#root')
if (!rootElem) throw new Error('No root elem!')

createRoot(rootElem).render(<App />)
