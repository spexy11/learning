import { createView, defineFeedback, defineSchema, expr, useExerciseContext } from '@learning/core'
import { createMemo } from 'solid-js'
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
  },
})

const feedback = defineFeedback<typeof schema>({
  start: async ({ question, state }) => {
    const equal = await expr(state.attempt).isEqual(question.expr)
    const factored = await expr(state.attempt).isFactored()
    const correct = equal && factored
    return { correct, score: [Number(correct), 1], next: null }
  },
})

export const Factor = createView(schema, feedback, {
  start: (props) => {
    const question = () => expr(props.question.expr)
    const attempt = () => expr(props.state?.attempt)
    const answer = createMemo(() => attempt() && question().factor().latex())
    const correct = createMemo(() => attempt()?.isEqual(question()) && attempt()?.isFactored())
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
              exercise.setState((state) => {
                state.attempt = e.target.value
              })
            }}
          />
        </p>
        <p>La réponse est {answer()}</p>
        <p>Correct: {correct() ? 'Oui' : 'Non'}</p>
      </>
    )
  },
})
