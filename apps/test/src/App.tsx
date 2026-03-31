import { createSignal, type Component } from 'solid-js'
import { Factor } from './Exercise'

const App: Component = () => {
  const [data, setData] = createSignal({
    name: 'math/factor' as const,
    question: { expr: '(x + {a})(x + {b})' },
    params: {
      a: [1, 2, 3],
      b: [1, 2, 3],
    },
    attempt: [],
  })
  return (
    <>
      <Factor fetch={data} save={setData} />
    </>
  )
}

export default App
