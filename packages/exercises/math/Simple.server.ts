import { expr, field, type Feedback, type Schema } from '@learning/core'

export const schema = {
  name: 'math/simple',
  question: {
    text: field('markdown').meta({
      label: 'Énoncé',
      description: "Énoncé de l'exercice",
    }),
    answer: field('math').meta({
      label: 'Réponse',
      description: "Réponse de l'exercice",
    }),
    label: field('markdown').meta({
      label: 'Libellé de la réponse',
      description: 'Texte affiché juste avant le champ de la réponse',
    }),
    unit: field('markdown').meta({
      label: 'Unité',
      description: 'Texte affiché juste après le champ de la réponse',
    }),
  },
  steps: {
    start: { attempt: field('math') },
  },
} as const satisfies Schema

export const feedback = {
  start: async function* ({ question, state }) {
    const equal = await expr(state.attempt).isEqual(question.answer)
    yield [Number(equal), 1]
    return { equal }
  },
} satisfies Feedback<typeof schema>
