import { Button, Field } from '@learning/components'
import { action, json, useSubmission } from '@solidjs/router'
import { createSignal, For, Show } from 'solid-js'
import * as v from 'valibot'
import { generator } from './gen.feedback'
import BaseExercise from './gen.schema'
import Exercise from './gen.view'

const Meta = v.object({
  type: v.optional(
    v.union([v.literal('textarea'), v.literal('input'), v.literal('latex'), v.literal('markdown')]),
    'input',
  ),
})

const info = BaseExercise.options.map((s) => ({
  name: s.entries.name.literal,
  question: Object.entries(s.entries.question.entries).map(([name, value]: [string, any]) => {
    return {
      name,
      ...v.parse(Meta, v.getMetadata(value)),
      title: v.getTitle(value),
      description: v.getDescription(value),
      examples: v.getExamples(value),
    }
  }),
}))

export function ExerciseEditor() {
  const [selected, setSelected] = createSignal('math/factor')
  const meta = () => info.find((e) => e.name === selected())
  const submitExercise = action(async (name: string, form: FormData) => {
    const data = generator({
      name,
      question: Object.fromEntries(form.entries()),
      attempt: [],
    } as any)
    return json(data, { revalidate: 'nothing' })
  }, 'hello')
  const submission = useSubmission(submitExercise)
  return (
    <>
      <form
        class="bg-slate-100 container mx-auto p-4 rounded-xl"
        method="post"
        action={submitExercise.with(selected() ?? '')}
      >
        <Field
          type="select"
          label="Exercice"
          value={selected()}
          onChange={(e) => {
            setSelected(e.target.value)
          }}
        >
          <For each={info}>
            {(exercise) => <option value={exercise.name}>{exercise.name}</option>}
          </For>
        </Field>
        <fieldset>
          <Show when={meta()}>
            <For each={meta()?.question}>
              {(field) => (
                <Field
                  name={field.name}
                  type={field.type as any}
                  label={field.title}
                  title={field.description}
                  placeholder={field.description}
                />
              )}
            </For>
            <Button color="green">Créer un exercice</Button>
          </Show>
        </fieldset>
      </form>
      <Show when={submission.result}>
        <Exercise {...(submission.result as any)} />
      </Show>
    </>
  )
}

export default Exercise
