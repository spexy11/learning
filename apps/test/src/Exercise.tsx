import { createView, defineFeedback, defineSchema, expr, useExerciseContext } from '@learning/core'
import { createMemo, Show } from 'solid-js'
import * as v from 'valibot'

const schema = defineSchema({
  name: 'math/factor',
  question: { expr: v.string() },
  transform: async (question) => {
    return { expr: await expr(question.expr).expand().latex() }
  },
  steps: {
    start: {
      previous: [],
      state: {
        attempt: v.string(),
      },
    },
    root: {
      previous: ['start'],
      state: {
        root: v.string(),
      },
    },
  },
})

const feedback = defineFeedback<typeof schema>({
  start: async ({ question, state }) => {
    const equal = await expr(state.attempt).isEqual(question.expr)
    const factored = await expr(state.attempt).isFactored()
    const correct = equal && factored
    return { correct, score: [Number(correct), 1], next: correct ? null : 'root' }
  },
  root: async ({ question, state }) => {
    const correct = await expr(question.expr).checkRoot(state.root)
    return { correct, score: [0, 0], next: null }
  },
})

export const Factor = createView(schema, feedback, {
  start: (props) => {
    const question = () => expr(props.question.expr)
    const attempt = () => expr(props.state?.attempt)
    const answer = createMemo(() => attempt() && question().factor().latex())
    const equal = createMemo(() => attempt()?.isEqual(question()))
    const factored = createMemo(() => attempt()?.isFactored())
    const correct = () => equal() && factored()
    const exercise = useExerciseContext()
    return (
      <>
        <p>Factorisez l'expression suivante: {props.question.expr}</p>
        <p>
          Tentative:{' '}
          <input
            value={props.state?.attempt ?? ''}
            readonly={props.state !== undefined}
            onInput={(e) => {
              // @ts-ignore
              exercise.setState((state) => {
                state.attempt = e.target.value
              })
            }}
          />
        </p>
        <Show when={props.state}>
          <p>La réponse est {answer()}</p>
        </Show>
        <Show when={correct() !== undefined}>
          <p>Correct: {correct() ? 'Oui' : 'Non'}</p>
        </Show>
      </>
    )
  },
  root: (props) => {
    const exercise = useExerciseContext()
    const correct = createMemo(
      () => props.state && expr(props.question.expr).checkRoot(props.state?.root ?? ''),
    )
    return (
      <>
        <p>Trouvez une racine de {props.question.expr}</p>
        <input
          value={props.state?.root ?? ''}
          onInput={(e) => {
            // @ts-ignore
            exercise.setState((state) => {
              state.root = e.target.value
            })
          }}
        />
        <Show when={correct() !== undefined}>
          <p>Correct: {correct() ? 'Oui' : 'Non'}</p>
        </Show>
      </>
    )
  },
})
