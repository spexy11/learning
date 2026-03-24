import { createSignal, snapshot, type Component } from 'solid-js'
import { Factor } from './Exercise'

const App: Component = () => {
  const [data, setData] = createSignal({
    name: 'math/factor' as const,
    question: { expr: '(x - 1)(x + 1)' },
    attempt: [],
  })
  return (
    <>
      <Factor
        fetch={() => {
          console.log('Fetching exercise')
          return data()
        }}
        save={(exercise) => {
          const ex = snapshot(exercise)
          console.log('Saving', JSON.stringify(ex, null, 2))
          setData(ex)
        }}
      />
    </>
  )
}

export default App
