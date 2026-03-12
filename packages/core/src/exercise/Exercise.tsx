import { Button, Field } from '@learning/components'
import { createAsync, query, useSubmission, type Action } from '@solidjs/router'
import { isEqual, mapValues } from 'es-toolkit'
import {
  createEffect,
  For,
  lazy,
  Show,
  Suspense,
  type Component,
  type ComponentProps,
  type JSX,
} from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import { Dynamic } from 'solid-js/web'
import * as v from 'valibot'
import type { Exercise, View } from './schemas'
import {
  GradedExercise,
  type BaseExercise,
  type createFeedbackFunction,
  type ModelRegistry,
} from './server'

export type ViewRegistry = Record<string, Component<any>>
type Props<T extends View<any>> = ComponentProps<T[keyof T]>

export function loadView<T extends View<any>>(importModule: () => Promise<{ default: T }>) {
  return lazy(async () => {
    const { default: view } = await importModule()
    return {
      default: ((props) => <Dynamic component={view[props.step]} {...props} />) as Component<
        Props<T>
      >,
    }
  })
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

export function createExercise<S extends ModelRegistry, V extends ViewRegistry>(
  viewRegistry: V,
  schema: v.VariantSchema<'name', ReturnType<typeof Exercise>[], undefined>,
  grade: Action<[BaseExercise<S>, string, FormData], GradedExercise<S>>,
  getFeedback: ReturnType<typeof query<ReturnType<typeof createFeedbackFunction<S>>>>,
) {
  return function Exercise(props: GradedExercise<S>) {
    const submission = useSubmission(grade, ([ex]) => isEqual(props, ex))
    const [graded, setGraded] = createStore(props)
    createEffect(() => {
      if (submission.result) {
        setGraded(reconcile(submission.result, { merge: true }))
      }
    })

    const field = ({ step, state }: Optional<BaseExercise<S>['attempt'][number], 'state'>) => {
      const exerciseSchema = schema.options.find((s) => s.entries.name.literal === props.name)!
      const stateSchema = exerciseSchema.entries.attempt.item.options.find(
        (s) => s.entries.step.literal === step,
      )!.entries.state
      return {
        question: mapValues(exerciseSchema.entries.question.entries, (field, name) => {
          const attrs = {
            type: (v.getMetadata(field).type as any) ?? 'input',
            label: v.getTitle(field),
            title: v.getDescription(field),
            ...v.getMetadata(field),
            value: props.question[name],
            readOnly: true,
            hideLabel: true,
          } as ComponentProps<typeof Field>
          return () => <Field {...attrs} />
        }),
        state: mapValues(stateSchema.entries, (field, name) => {
          const attrs = {
            name,
            type: (v.getMetadata(field).type as any) ?? 'input',
            label: v.getTitle(field),
            title: v.getDescription(field),
            ...v.getMetadata(field),
            value: state?.[name] ?? '',
            readOnly: state,
            hideLabel: true,
          } as ComponentProps<typeof Field>
          return () => <Field {...attrs} />
        }),
      }
    }

    const component = () => {
      if (!(props.name in viewRegistry)) throw new Error(`View ${props.name} does not exist`)
      return viewRegistry[props.name]
    }

    const next = () => {
      if (graded.attempt.length === 0) return 'start'
      return graded.attempt[graded.attempt.length - 1]!.next
    }

    return (
      <>
        <For each={graded.attempt}>
          {(part, i) => {
            const feedback = createAsync(() => getFeedback({ ...graded, ...part }))
            return (
              <Step index={i() + 1} disabled>
                <Suspense fallback="Correction en cours...">
                  <Dynamic
                    component={component()}
                    {...props}
                    {...part}
                    feedback={feedback}
                    field={field(part)}
                  />
                </Suspense>
              </Step>
            )
          }}
        </For>
        <Show when={next()}>
          <form method="post" action={grade.with(graded, String(next()))}>
            <Step index={graded.attempt.length + 1}>
              <Dynamic
                component={component()}
                {...props}
                step={next()}
                feedback={() => undefined}
                field={field({ step: next()!, state: undefined } as any)}
              />
              <Button color="green">Soumettre</Button>
            </Step>
          </form>
        </Show>
      </>
    )
  }
}

function Step(props: {
  children: JSX.Element
  disabled?: boolean
  grade?: [number, number]
  index: number
}) {
  return (
    <fieldset
      class="container mx-auto my-4 rounded-xl p-4 shadow-sm"
      classList={{
        'bg-blue-50 hover:bg-blue-100': !props.disabled,
        'bg-slate-50 hover:bg-slate-100': props.disabled === true,
      }}
      disabled={props.disabled === true}
    >
      <div class="flex justify-between">
        <h3 class="mb-3 text-xl font-bold text-sky-900">Étape {props.index}</h3>
        <Show when={props.grade?.[1] ?? 0 > 0}>
          <h4>{props.grade?.join('/')}</h4>
        </Show>
      </div>
      <div>{props.children}</div>
    </fieldset>
  )
}
