import { mapAsync } from 'es-toolkit'
import type { Component } from 'solid-js'
import * as v from 'valibot'

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
  const base = v.object({
    step: v.literal(step),
    state: v.object((schema.steps as T['steps'])[step as K].state as T['steps'][K]['state']),
  })
  const extended = v.object({
    ...base.entries,
    correct: v.boolean(),
    score: v.strictTuple([v.number(), v.number()]),
  })
  return (graded ? extended : base) as G extends true ? typeof extended : typeof base
}

type Part<T extends Schema, K extends keyof T['steps'], G extends boolean = false> = Infer<
  typeof Part<T, K, G>
>

function PartUnion<T extends Schema, K extends keyof T['steps'], G extends boolean = false>(
  schema: T,
  steps: K[],
  graded?: G,
) {
  return v.variant(
    'step',
    steps.map((step) => Part(schema, step, graded)),
  ) as v.VariantSchema<'step', { [S in K]: ReturnType<typeof Part<T, S, G>> }[K][], undefined>
}

type Props<
  T extends Schema,
  K extends keyof T['steps'],
  L extends (keyof T['steps'])[] = [],
  F extends boolean = true,
> = {
  question: InferFromShape<T['question']>
  state: InferFromShape<T['steps'][K]['state']>
  previous: { [I in keyof L]: InferFromShape<T['steps'][L[I]]['state']> }
} & (F extends true ? { feedback: { correct: boolean; score: [number, number] } } : {})

type Feedback<T extends Schema, K extends keyof T['steps'], L extends (keyof T['steps'])[] = []> = (
  props: Props<T, K, L, false>,
) => MaybeAsync<{ correct: boolean; score: [number, number]; next: keyof T['steps'] | null }>

export function defineFeedback<T extends Schema>(data: {
  [K in keyof T['steps']]: Feedback<T, K, [...T['steps'][K]['previous'], ...(keyof T['steps'])[]]>
}) {
  return data
}

type View<T extends Schema> = {
  [K in keyof T['steps']]: Component<
    Props<T, K, [...T['steps'][K]['previous'], ...(keyof T['steps'])[]]>
  >
}

export function buildSchemas<T extends Schema, G extends boolean = false>(
  schema: T,
  feedback: ReturnType<typeof defineFeedback<T>>,
) {
  const steps = Object.keys(schema.steps) as T['steps'][keyof T['steps']]
  const attempt = v.array(PartUnion(schema, steps, false))
  const gradedAttempt = v.array(PartUnion(schema, steps, true))
  const common = v.object({
    name: v.literal(schema.name as T['name']),
    question: v.object(schema.question as T['question']),
  })
  const base = v.object({
    ...common.entries,
    attempt,
  })
  return {
    load: v.pipeAsync(
      v.object({
        ...common.entries,
        attempt: v.union([gradedAttempt, v.null()]),
      }),
      v.transformAsync(async ({ attempt, question, ...exercise }) => {
        if (attempt === null && schema.transform) {
          question = await schema.transform(question)
        }
        return { ...exercise, question, attempt: attempt ?? [] }
      }),
    ),
    grade: v.pipeAsync(
      base,
      v.transformAsync(async ({ attempt, ...exercise }) => {
        const graded = await mapAsync(attempt, async (part, i) => {
          const result = await feedback[part.step]({
            question: exercise.question,
            state: part.state,
            previous: attempt.slice(0, i).toReversed() as any,
          })
          return { ...part, ...result }
        })
        return { ...exercise, attempt: graded }
      }),
    ),
  }
}
