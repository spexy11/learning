import Exercise, { ExerciseEditor } from '@learning/exercises'
import { generator } from '@learning/exercises/gen.feedback'
import { createAsync } from '@solidjs/router'
import { Show } from 'solid-js'
import { Spinner } from '@learning/components'

export default function Home() {
  const generated = createAsync(async () =>
    generator({
      name: 'math/factor',
      params: {
        roots: ['sample', [-2, -3], 2],
      },
      question: {
        expr: '(x - `roots.0`)(x - `roots.1`)',
      },
      attempt: [],
    }),
  )
  return (
    <main>
      <ExerciseEditor />
      <Spinner>
        <Show when={generated()}>
          <Exercise {...generated()!} attempt={[]} />
        </Show>
      </Spinner>
    </main>
  )
}
