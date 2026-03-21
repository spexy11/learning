import { mapAsync } from 'es-toolkit'
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
  const S extends Record<string, { previous: (keyof S)[]; state: RawShape }> & {
    start: { previous: []; state: RawShape }
  },
>(schema: { name: N; question: Q; transform?: T; steps: S }) {
  return schema
}

type Schema<
  N extends string = any,
  Q extends RawShape = any,
  T extends (question: InferFromShape<Q>) => Promise<InferFromShape<Q>> = any,
  S extends Record<string, { previous: (keyof S)[]; state: RawShape }> & {
    start: { previous: []; state: RawShape }
  } = any,
> = ReturnType<typeof defineSchema<N, Q, T, S>>

function Part<T extends Schema, K extends keyof T['steps'], G extends boolean = false>(
  schema: T,
  step: K,
  graded?: G,
) {
  const base = v.object({
    step: v.literal(step as K),
    state: v.object(schema.steps[step].state as T['steps'][K]['state']),
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

function PartUnion<
  T extends Schema,
  K extends readonly (keyof T['steps'])[],
  G extends boolean = false,
>(schema: T, steps: K, graded?: G) {
  return v.variant(
    'step',
    steps.map((step) => Part(schema, step, graded)),
  ) as v.VariantSchema<'step', { [I in keyof K]: ReturnType<typeof Part<T, K[I], G>> }, undefined>
}

type Props<T extends Schema, K extends keyof T['steps'], F extends boolean = true> = {
  question: InferFromShape<T['question']>
  state?: InferFromShape<T['steps'][K]['state']>
  previous: {
    [S in T['steps'][K]['previous'][number]]: InferFromShape<T['steps'][S]['state']>
  }[T['steps'][K]['previous'][number]][]
} & (F extends true ? Partial<{ correct: boolean; score: [number, number] }> : {})

type Feedback<T extends Schema, K extends keyof T['steps']> = (
  props: Required<Props<T, K, false>>,
) => MaybeAsync<{ correct: boolean; score: [number, number]; next: keyof T['steps'] | null }>

export function defineFeedback<T extends Schema>(data: {
  [K in keyof T['steps']]: Feedback<T, K>
}) {
  return data
}

export function buildSchemas<T extends Schema>(
  schema: T,
  feedback: ReturnType<typeof defineFeedback<T>>,
) {
  const steps = Object.keys(schema.steps) as T['steps'][keyof T['steps']]
  return {
    Student: v.pipeAsync(
      v.object({
        name: v.literal(schema.name as T['name']),
        question: v.object(schema.question as T['question']),
        attempt: v.union([
          v.array(v.union([PartUnion(schema, steps, true), PartUnion(schema, steps, false)])),
          v.null(),
        ]),
      }),
      v.transformAsync(async ({ attempt, question, ...exercise }) => {
        let modifiedAttempt: (
          | NonNullable<typeof attempt>[number]
          | Pick<NonNullable<typeof attempt>[number], 'step'>
        )[] = attempt ?? []
        if (attempt === null && schema.transform) {
          question = await schema.transform(question)
          modifiedAttempt = [{ step: 'start' }]
        }
        modifiedAttempt = await mapAsync(modifiedAttempt, async (part, i) => {
          if ('state' in part) {
            const result = await feedback[part.step]({
              question: question,
              state: part.state,
              previous: modifiedAttempt.slice(0, i).toReversed() as any,
            })
            return { ...part, ...result }
          }
          return part
        })
        return { ...exercise, question, attempt: modifiedAttempt }
      }),
    ),
    get grade() {
      return v.parserAsync(this.Student)
    },
  }
}
