import { query } from '@solidjs/router'
import registry from './registry'
import { buildSchema } from './schema'
import type { Exercise, ExerciseTemplate, Feedback, FeedbackReturn, Part, Schema } from './types'
import { mapAsync, memoize } from 'es-toolkit'

async function extractFeedback<
  T extends Schema,
  F extends Feedback<T>,
  K extends keyof T['steps'] & string,
>(
  schema: T,
  feedback: F,
  info: 'feedback',
  rawExercise: Exercise<T, K>,
): Promise<FeedbackReturn<F[K]>>
async function extractFeedback<
  T extends Schema,
  F extends Feedback<T>,
  K extends keyof T['steps'] & string,
>(
  schema: T,
  feedback: F,
  info: 'grade',
  rawExercise: Exercise<T, K>,
): Promise<{ next: keyof T['steps'] | null; score: [number, number] }>
async function extractFeedback<
  T extends Schema,
  F extends Feedback<T>,
  K extends keyof T['steps'] & string,
>(schema: T, feedback: F, info: 'grade' | 'feedback', rawExercise: Exercise<T, K>) {
  'use server'
  const exercise = await buildSchema(schema).parseAsync(rawExercise)
  const step = rawExercise.attempt[0].step
  const generator = feedback[step](exercise as any)
  let score: [number, number] = [0, 0]
  let next: keyof T['steps'] | null = null
  while (true) {
    const { value, done } = await generator.next()
    if (done) {
      if (info === 'feedback') return value
      return { score, next }
    }
    if (Array.isArray(value)) {
      if (Array.isArray(value[0]) && (typeof value[1] === 'string' || value[1] === null)) {
        score = [score[0] + value[0][0], score[1] + value[0][1]]
        next = value[1]
      } else if (typeof value[0] === 'number' && typeof value[1] === 'number') {
        score = [score[0] + value[0], score[1] + value[1]]
      }
    } else next = value
  }
}

export type Module<N extends keyof (typeof registry)['server']> =
  Awaited<ReturnType<(typeof registry)['server'][N]>> extends {
    schema: infer T extends Schema
    feedback: infer F extends Record<string, any> & { start: any }
  }
    ? { schema: T; feedback: F }
    : never

const getModule = memoize(
  async <N extends keyof (typeof registry)['server']>(name: N): Promise<Module<N>> => {
    const { schema, feedback } = await registry.server[name]()
    return { schema, feedback } as any
  },
)

type ModuleNames = keyof (typeof registry)['server']

const getFeedbackFunction = async <
  const N extends ModuleNames,
  const E extends Exercise<Module<N>['schema']>,
>(
  exercise: E & { name: N },
): Promise<FeedbackReturn<Module<N>['feedback'][keyof Module<N>['feedback']]>> => {
  'use server'
  const { schema, feedback } = await getModule(exercise.name)
  return extractFeedback(
    schema,
    feedback as Feedback<typeof schema>,
    'feedback',
    exercise as Exercise<typeof schema, string>,
  )
}

export const getFeedback = query(getFeedbackFunction, 'getFeedback') as typeof getFeedbackFunction

const getFullFeedbackFunction = async <
  N extends ModuleNames,
  const E extends ExerciseTemplate<Module<N>['schema']>,
>(
  exercise: E & { name: N },
) => {
  'use server'
  return mapAsync(exercise.attempt ?? [], (_, i) =>
    getFeedback({
      ...exercise,
      attempt: exercise.attempt?.slice(i) as [
        Part<Module<N>['schema']>,
        ...Part<Module<N>['schema']>[],
      ],
    }),
  )
}

export const getFullFeedback = query(
  getFullFeedbackFunction,
  'getFullFeedback',
) as typeof getFullFeedbackFunction

const gradePart = async <
  const N extends ModuleNames,
  const E extends Exercise<Module<N>['schema']>,
>(
  exercise: E & { name: N },
): Promise<{
  score: [number, number]
  next: keyof Module<N>['schema']['steps'] | null
}> => {
  const { schema, feedback } = await getModule(exercise.name)
  return extractFeedback(
    schema,
    feedback as Feedback<typeof schema>,
    'grade',
    exercise as Exercise<typeof schema, string>,
  )
}
async function gradeExerciseFunction<
  N extends ModuleNames,
  const E extends ExerciseTemplate<Module<N>['schema']>,
>(exercise: E & { name: N }) {
  'use server'
  return mapAsync(exercise.attempt ?? [], async (_part, i) => {
    return gradePart({
      ...exercise,
      attempt: exercise.attempt?.slice(i) as [
        Part<Module<N>['schema']>,
        ...Part<Module<N>['schema']>[],
      ],
    })
  })
}

export const gradeExercise = query(
  gradeExerciseFunction,
  'gradeExercise',
) as typeof gradeExerciseFunction
