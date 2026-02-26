import { action, createAsyncStore, json, useSubmission } from "@solidjs/router";
import { getSchemaInfo } from "./gen.feedback";
import { createSignal, For, Show } from "solid-js";
import { Button, Field } from "@learning/components";
import Exercise from "./gen.view";

export function ExerciseEditor() {
  const info = createAsyncStore(() => getSchemaInfo());
  const [selected, setSelected] = createSignal<null | string>("math/factor");
  const meta = () => info()?.find((e) => e.name === selected());
  const submitExercise = action(async (name: string, form: FormData) => {
    return json(
      {
        name,
        question: Object.fromEntries(form.entries()),
        attempt: [],
      },
      { revalidate: "nothing" },
    );
  }, "hello");
  const submission = useSubmission(submitExercise);
  return (
    <>
      <form
        class="bg-slate-100 container mx-auto p-4 rounded-xl"
        method="post"
        action={submitExercise.with(selected() ?? "")}
      >
        <Field
          component="select"
          label="Exercice"
          onChange={(e) => {
            setSelected(e.target.value);
          }}
        >
          <For each={info()}>
            {(exercise) => (
              <option value={exercise.name}>{exercise.name}</option>
            )}
          </For>
        </Field>
        <fieldset>
          <Show when={meta()}>
            <For each={meta()?.question}>
              {(field) => (
                <Field
                  name={field.name}
                  component={field.type as any}
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
  );
}

export default Exercise;
