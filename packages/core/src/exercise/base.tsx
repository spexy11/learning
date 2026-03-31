import { Dynamic } from '@solidjs/web'
import { mapAsync, mapValues, sample } from 'es-toolkit'
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

type Field<T = any, U = any> = {
  base: v.GenericSchema<any, T>
  feedback: v.GenericSchema<T, U>
}

export function defineField<T, U>(field: Field<T, U>) {
  return field
}

type RawShape = Record<string, Field>
function RawShapeSchema<T extends RawShape, S extends 'base' | 'feedback'>(shape: T, stage: S) {
  return v.object(mapValues(shape, (field) => field[stage]) as { [K in keyof T]: T[K][S] })
}

type InferFromShape<T extends Record<string, Field>, S extends 'base' | 'feedback'> = v.InferOutput<
  ReturnType<typeof RawShapeSchema<T, S>>
>

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
  T extends (question: InferFromShape<Q, 'feedback'>) => Promise<InferFromShape<Q, 'base'>>,
  const S extends Record<string, { previous: (keyof S)[]; state: RawShape }> & {
    start: { previous: []; state: RawShape }
  },
>(schema: { name: N; question: Q; transform?: T; steps: S }) {
  return schema
}

type Schema<
  N extends string = any,
  Q extends RawShape = any,
  T extends (question: InferFromShape<Q, 'feedback'>) => Promise<InferFromShape<Q, 'base'>> = any,
  S extends Record<string, { previous: (keyof S)[]; state: RawShape }> & {
    start: { previous: []; state: RawShape }
  } = any,
> = ReturnType<typeof defineSchema<N, Q, T, S>>

function Part<
  T extends Schema,
  K extends keyof T['steps'],
  S extends boolean = false,
  V extends 'base' | 'feedback' = 'base',
>(schema: T, step: K, withState?: S, stage?: V) {
  const base = v.object({
    step: v.literal(step as K),
  })
  const extended = v.object({
    ...base.entries,
    state: RawShapeSchema(schema.steps[step].state as T['steps'][K]['state'], stage ?? 'base'),
  })
  return (withState ? extended : base) as S extends true ? typeof extended : typeof base
}

type Part<
  T extends Schema,
  K extends keyof T['steps'],
  S extends boolean = false,
  V extends 'base' | 'feedback' = 'base',
> = Infer<typeof Part<T, K, S, V>>

function PartUnion<
  T extends Schema,
  K extends readonly (keyof T['steps'])[],
  S extends boolean = false,
  V extends 'base' | 'feedback' = 'base',
>(schema: T, steps: K, withState?: S, stage?: V) {
  return v.variant(
    'step',
    steps.map((step) => Part(schema, step, withState, stage)),
  ) as v.VariantSchema<
    'step',
    { [I in keyof K]: ReturnType<typeof Part<T, K[I], S, V>> },
    undefined
  >
}

type PartUnion<
  T extends Schema,
  K extends readonly (keyof T['steps'])[] = readonly (keyof T['steps'])[],
  S extends boolean = false,
  V extends 'base' | 'feedback' = 'base',
> = Infer<typeof PartUnion<T, K, S, V>>

type Props<T extends Schema, K extends keyof T['steps'], F extends boolean = true> = {
  question: InferFromShape<T['question'], 'feedback'>
  state?: InferFromShape<T['steps'][K]['state'], 'feedback'>
  previous: {
    [S in T['steps'][K]['previous'][number]]: InferFromShape<T['steps'][S]['state'], 'feedback'>
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

function Attempt<T extends Schema, V extends 'base' | 'feedback'>(schema: T, stage: V) {
  const steps = Object.keys(schema.steps) as T['steps'][keyof T['steps']]
  return v.array(
    v.union([PartUnion(schema, steps, true, stage), PartUnion(schema, steps, false, stage)]),
  )
}

function Param<T extends boolean>(transform: T) {
  const value = v.union([v.number(), v.string()])
  const base = v.array(value)
  const withTransform = v.pipe(base, v.transform(sample))
  return (transform ? withTransform : base) as T extends true ? typeof withTransform : typeof base
}

function Params<T extends boolean>(transform: T) {
  return v.record(v.string(), Param(transform))
}

export function buildSchemas<T extends Schema>(
  schema: T,
  feedback: ReturnType<typeof defineFeedback<T>>,
) {
  return {
    Teacher: v.object({
      name: v.literal(schema.name as T['name']),
      question: RawShapeSchema(schema.question as T['question'], 'base'),
      params: v.optional(Params(false)),
    }),
    Student: v.pipeAsync(
      v.object({
        name: v.literal(schema.name as T['name']),
        question: RawShapeSchema(schema.question as T['question'], 'base'),
        attempt: Attempt(schema, 'base'),
        params: v.optional(Params(true)),
      }),
      // TODO: calls need to be deduped, waiting for solid-router release?
      v.transformAsync(async ({ attempt, question: q, params, ...exercise }) => {
        let question = q
        function subs<T extends any>(param: string, value: string, v: T): T {
          if (typeof v === 'string') {
            return v.replaceAll(`{${param}}`, value) as T
          } else if (Array.isArray(v)) {
            return v.map(subs.bind(null, param, value)) as T
          } else if (typeof v === 'object' && v !== null) {
            return mapValues(v, subs.bind(null, param, value)) as T
          }
          return v
        }
        for (const [param, value] of Object.entries(params ?? {})) {
          question = subs(param, String(value), question)
        }
        const parsedQuestion = v.parse(
          RawShapeSchema(schema.question as T['question'], 'feedback'),
          question,
        )
        const parsedAttempt = v.parse(Attempt(schema, 'feedback'), attempt)
        let modifiedAttempt = attempt
        if (attempt.length === 0 && schema.transform) {
          question = await schema.transform(parsedQuestion)
        }
        modifiedAttempt = await mapAsync(modifiedAttempt, async (part, i) => {
          if ('state' in part && 'state' in parsedAttempt[i]! && part.state) {
            const result = await feedback[part.step]({
              question: parsedQuestion,
              state: parsedAttempt[i]!.state ?? part.state,
              previous: parsedAttempt.slice(0, i).toReversed() as any,
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
    const parsedQuestion = createMemo(() =>
      v.parse(RawShapeSchema(schema.question as T['question'], 'feedback'), exercise().question),
    )
    const parsedAttempt = createMemo(() => v.parse(Attempt(schema, 'feedback'), exercise().attempt))
    return (
      <Loading fallback="Génération de l'exercice...">
        <For each={parsedAttempt()}>
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
              const graded = await grade({
                ...exercise(),
                attempt: [
                  ...exercise().attempt.toSpliced(-1),
                  validated().output as Part<T, K, true>,
                ],
              })
              await props.save(graded)
              refresh(() => exercise)
            }
            return (
              <ExerciseContext value={{ readOnly: !!part().state, state, setState }}>
                <Dynamic
                  component={view[part().step]}
                  {...({
                    question: parsedQuestion(),
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
