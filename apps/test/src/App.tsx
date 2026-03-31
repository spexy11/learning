import { createSignal, type Component } from 'solid-js'
import { Factor } from './Exercise'

const App: Component = () => {
  const [data, setData] = createSignal({
    name: 'math/factor' as const,
    question: { expr: '(x - 1)(x + 1)' },
    attempt: [],
  })
  return (
    <>
      <Factor fetch={data} save={setData} />
    </>
  )
}

export default App
