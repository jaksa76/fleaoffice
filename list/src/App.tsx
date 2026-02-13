import { useState } from 'react'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
          <img src={javascriptLogo} className="logo vanilla" alt="JavaScript logo" />
        </a>
        <h1>Hello Vite!</h1>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
        </div>
        <p className="read-the-docs">
          Click on the Vite logo to learn more
        </p>
      </div>
    </>
  )
}

export default App
