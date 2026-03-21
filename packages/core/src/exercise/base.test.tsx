import { expect, test } from 'bun:test'
import * as v from 'valibot'
import { expr } from '../expr'
import { buildSchemas, defineFeedback, defineSchema } from './base'

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

const { grade } = buildSchemas(schema, feedback)

test('exercise schemas: grading works', async () => {
  const exercise = {
    name: 'math/factor',
    question: { expr: 'x^2 - 5x + 6' },
    attempt: [{ step: 'start', state: { attempt: '(x - 2)(x - 3)' } }],
  }
  const { attempt } = await grade(exercise)
  expect(attempt[0]).toMatchObject({
    step: 'start',
    state: { attempt: '(x - 2)(x - 3)' },
    correct: true,
    score: [1, 1],
  })
})

test('exercise schemas: exercises are regraded', async () => {
  const exercise = {
    name: 'math/factor',
    question: { expr: 'x^2 - 5x + 6' },
    attempt: [
      { step: 'start', state: { attempt: '(x - 2)(x - 3)' }, correct: false, score: [0, 1] },
    ],
  }
  const { attempt } = await grade(exercise)
  expect(attempt[0]).toMatchObject({
    step: 'start',
    state: { attempt: '(x - 2)(x - 3)' },
    correct: true,
    score: [1, 1],
  })
})

test('exercise schemas: transforms are triggered', async () => {
  const exercise = {
    name: 'math/factor',
    question: { expr: '(x - 1)(x - 1)' },
    attempt: [],
  }
  const { question } = await grade(exercise)
  expect(question.expr).toBe('x^{2} - 2 x + 1')
})
