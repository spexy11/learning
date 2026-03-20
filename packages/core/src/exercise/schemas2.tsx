import * as v from 'valibot'
import { expr } from '../expr'

type MaybeAsync<T> = T | Promise<T>
type RawShape = Record<string, v.BaseSchema<any, any, any>>
type InferFromShape<T extends RawShape> = v.InferOutput<v.ObjectSchema<T, undefined>>

/**
 * Infer the type associated with a schema factory
 *
 * @remarks Exercise are schema factories because they depend on the shape of the question and the steps.
 * @typeParam F - The schema factory to infer the type from
 * @typeParam T - Whether to infer the input or output type of the schema factory
 */
type Infer<
  F extends (...args: any[]) => v.BaseSchema<any, any, any> | v.BaseSchemaAsync<any, any, any>,
  T extends 'input' | 'output' = 'output',
> = T extends 'output'
  ? v.InferOutput<ReturnType<F>>
  : T extends 'input'
    ? v.InferInput<ReturnType<F>>
    : never

/**
 * Defines an exercise schema
 *
 * @remarks
 * Step schemas must be defined this early
 * so that feedback function can fully infer the type of the attempt.
 */
export function defineSchema<
  const N extends string,
  Q extends RawShape,
  T extends (question: InferFromShape<Q>) => Promise<InferFromShape<Q>>,
  const S extends Record<string, { previous: (keyof S)[]; state: RawShape }>,
>(schema: { name: N; question: Q; transform?: T; steps: S }) {
  return schema
}

type Schema<
  N extends string = any,
  Q extends RawShape = any,
  T extends (question: InferFromShape<Q>) => Promise<InferFromShape<Q>> = any,
  S extends Record<string, { previous: (keyof S)[]; state: RawShape }> = any,
> = ReturnType<typeof defineSchema<N, Q, T, S>>

function Part<T extends Schema, K extends keyof T['steps'], G extends boolean>(
  schema: T,
  step: K,
  graded?: G,
) {
  const extra = {
    correct: v.boolean(),
    score: v.strictTuple([v.number(), v.number()]),
  }
  return v.object({
    step: v.literal(step),
    state: v.object((schema.steps as T['steps'])[step as K].state as T['steps'][K]['state']),
    ...((graded ? extra : {}) as G extends true ? typeof extra : {}),
  })
}

type Part<T extends Schema, K extends keyof T['steps'], G extends boolean = false> = Infer<
  typeof Part<T, K, G>
>

type Feedback<T extends Schema, K extends keyof T['steps'], L extends (keyof T['steps'])[] = []> = (
  question: InferFromShape<T['question']>,
  state: InferFromShape<T['steps'][K]['state']>,
  ...previous: { [I in keyof L]: InferFromShape<T['steps'][L[I]]['state']> }
) => MaybeAsync<{ correct: boolean; score: [number, number]; next: keyof T['steps'] | null }>

function defineFeedback<
  T extends Schema,
  F extends { [K in keyof T['steps']]: Feedback<T, K, T['steps'][K]['previous']> },
>(schema: T, data: F): F {
  return data
}

// Example
const schema = defineSchema({
  name: 'math/factor',
  question: {
    expr: v.string(),
  },
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

const fee = defineFeedback(schema, {
  start: async (question, state) => {
    const correct = true
    return { correct, score: [1, 1], next: 'root' }
  },
  root: async (question, state, previous) => {
    const correct = true
    return { correct, score: [0, 0], next: null }
  },
})

const part = Part(schema, 'start', true)
type P = Part<typeof schema, 'start', true>
