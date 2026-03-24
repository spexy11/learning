import { Dynamic } from '@solidjs/web'
import { mapAsync } from 'es-toolkit'
import {
  createMemo,
  createStore,
  For,
  Loading,
  refresh,
  Show,
  type Component,
  type ComponentProps,
} from 'solid-js'
import * as v from 'valibot'
import { ExerciseContext } from './context'

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

function Part<T extends Schema, K extends keyof T['steps'], S extends boolean = false>(
  schema: T,
  step: K,
  withState?: S,
) {
  const base = v.object({
    step: v.literal(step as K),
  })
  const extended = v.object({
    ...base.entries,
    state: v.object(schema.steps[step].state as T['steps'][K]['state']),
  })
  return (withState ? extended : base) as S extends true ? typeof extended : typeof base
}

type Part<T extends Schema, K extends keyof T['steps'], S extends boolean = false> = Infer<
  typeof Part<T, K, S>
>

function PartUnion<
  T extends Schema,
  K extends readonly (keyof T['steps'])[],
  S extends boolean = false,
>(schema: T, steps: K, withState?: S) {
  return v.variant(
    'step',
    steps.map((step) => Part(schema, step, withState)),
  ) as v.VariantSchema<'step', { [I in keyof K]: ReturnType<typeof Part<T, K[I], S>> }, undefined>
}

type PartUnion<
  T extends Schema,
  K extends readonly (keyof T['steps'])[] = readonly (keyof T['steps'])[],
  S extends boolean = false,
> = Infer<typeof PartUnion<T, K, S>>

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
        attempt: v.array(
          v.union([PartUnion(schema, steps, true), PartUnion(schema, steps, false)]),
        ),
      }),
      // TODO: calls need to be deduped, waiting for solid-router release?
      v.transformAsync(async ({ attempt, question, ...exercise }) => {
        let modifiedAttempt = attempt
        if (attempt.length === 0 && schema.transform) {
          question = await schema.transform(question)
        }
        modifiedAttempt = await mapAsync(modifiedAttempt, async (part, i) => {
          if ('state' in part && part.state) {
            const result = await feedback[part.step]({
              question: question,
              state: part.state,
              previous: modifiedAttempt.slice(0, i).toReversed() as any,
            })
            return { ...part, ...result }
          }
          return part
        })
        if (modifiedAttempt.length === 0) modifiedAttempt.push({ step: 'start' })
        const lastPart = modifiedAttempt.at(-1)
        if (lastPart && 'next' in lastPart && lastPart.next) {
          modifiedAttempt.push({ step: lastPart.next })
        }
        return { ...exercise, question, attempt: modifiedAttempt }
      }),
    ),
    get grade() {
      return v.parserAsync(this.Student)
    },
  }
}

type Student<T extends Schema> =
  | v.InferInput<ReturnType<typeof buildSchemas<T>>['Student']>
  | v.InferOutput<ReturnType<typeof buildSchemas<T>>['Student']>
type View<T extends Schema> = { [K in keyof T['steps']]: Component<Props<T, K>> }
type FinalViewProps<T extends Schema> = {
  fetch: () => MaybeAsync<Student<T>>
  save: (exercise: v.InferOutput<ReturnType<typeof buildSchemas<T>>['Student']>) => any
}

export function createView<T extends Schema>(
  schema: T,
  feedback: ReturnType<typeof defineFeedback<T>>,
  view: View<T>,
) {
  const { Student, grade } = buildSchemas(schema, feedback)
  return function Component(props: FinalViewProps<T>) {
    const exercise = createMemo(async () => grade(await props.fetch()))
    return (
      <Loading fallback="Génération de l'exercice...">
        <p>{exercise().attempt.length} étapes</p>
        <For each={exercise().attempt}>
          {<K extends keyof T['steps']>(
            part: () =>
              | Part<T, K, true>
              | { step: K; state?: never; correct?: never; score?: never },
            i: () => number,
          ) => {
            const [state, setState] = createStore<Partial<Part<T, K>>>(() => part().state ?? {})
            const validated = createMemo(() =>
              v.safeParse(Part(schema, part().step, true), {
                ...part(),
                state,
              }),
            )
            const submit = async () => {
              if (!validated().success) return
              await props.save(
                await grade({
                  ...exercise(),
                  attempt: [
                    ...exercise().attempt.toSpliced(-1),
                    validated().output as Part<T, K, true>,
                  ],
                }),
              )
              refresh(() => exercise)
            }
            return (
              <ExerciseContext value={{ state, setState }}>
                <Dynamic
                  component={view[part().step]}
                  {...({
                    question: exercise().question,
                    state: part().state,
                    previous: exercise().attempt.slice(0, i()).toReversed() as any,
                  } satisfies Props<T, K> as ComponentProps<View<T>[K]>)}
                />
                <Show when={!part().state && validated().success}>
                  <button onClick={submit}>Soumettre</button>
                </Show>
              </ExerciseContext>
            )
          }}
        </For>
      </Loading>
    )
  }
}
