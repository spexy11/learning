import {
  createView,
  defineFeedback,
  defineField,
  defineSchema,
  expr,
  useExerciseContext,
} from '@learning/core'
import { createMemo, Show } from 'solid-js'
import * as v from 'valibot'

const Math = defineField({
  base: v.string(),
  feedback: v.pipe(v.string(), v.transform(expr)),
})

const schema = defineSchema({
  name: 'math/factor',
  question: { expr: Math },
  transform: async (question) => {
    return { expr: await question.expr.expand().latex() }
  },
  steps: {
    start: {
      previous: [],
      state: {
        attempt: Math,
      },
    },
    root: {
      previous: ['start'],
      state: {
        root: Math,
      },
    },
  },
})

const feedback = defineFeedback<typeof schema>({
  start: async ({ question: { expr: question }, state: { attempt } }) => {
    const [equal, factored] = await Promise.all([attempt.isEqual(question), attempt.isFactored()])
    const correct = equal && factored
    return { correct, score: [Number(correct), 1], next: correct ? null : 'root' }
  },
  root: async ({ question: { expr: question }, state: { root } }) => {
    const correct = await question.checkRoot(root)
    return { correct, score: [0, 0], next: null }
  },
})

export const Factor = createView(schema, feedback, {
  start: (props) => {
    const question = createMemo(() => props.question.expr)
    const attempt = createMemo(() => props.state?.attempt)
    const answer = createMemo(() => attempt() && question().factor().latex())
    const equal = createMemo(() => attempt()?.isEqual(question()))
    const factored = createMemo(() => attempt()?.isFactored())
    const correct = () => equal() && factored()
    const exercise = useExerciseContext()
    return (
      <>
        <p>Factorisez l'expression suivante: {props.question.expr.rawInput}</p>
        <p>
          Tentative:{' '}
          <input
            value={props.state?.attempt.rawInput ?? ''}
            readonly={props.state !== undefined}
            onInput={(e) => {
              exercise?.setState((state) => {
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
    const correct = createMemo(() => props.state && props.question.expr.checkRoot(props.state.root))
    return (
      <>
        <p>Trouvez une racine de {props.question.expr.rawInput}</p>
        <input
          value={props.state?.root.rawInput ?? ''}
          onInput={(e) => {
            exercise?.setState((state) => {
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
