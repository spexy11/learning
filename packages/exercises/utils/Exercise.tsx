import { Dynamic } from "solid-js/web";
import { getFeedback, gradeExercise, type Module } from "./queries";
import registry from "./registry";
import type { Exercise, Part, View } from "./types";
import {
  createEffect,
  createMemo,
  For,
  lazy,
  Show,
  Suspense,
  type Component,
} from "solid-js";
import { createStore } from "solid-js/store";
import { action, createAsync, useSubmission } from "@solidjs/router";
import { getSchema } from "./schema";

type ModuleNames = keyof (typeof registry)["views"];

type ModuleView<N extends ModuleNames> =
  Awaited<ReturnType<(typeof registry)["views"][N]>> extends View<infer T>
    ? View<T>
    : never;

type Props<
  N extends ModuleNames,
  K extends keyof ModuleView<N> = keyof ModuleView<N>,
> = {
  [S in keyof ModuleView<N>]: ModuleView<N>[S] extends Component<infer P>
    ? Omit<P, "attempt"> & { step: S; attempt: Part<Module<N>["schema"]>[] }
    : never;
}[K];

function loadComponent<N extends ModuleNames>(name: N) {
  return lazy(async () => {
    const view = (await registry["views"][name]()).default as ModuleView<N>;
    return {
      default: (props) =>
        (<Dynamic component={view[props.step]} {...props} />) as Component<
          Props<N>
        >,
    };
  });
}

const submitExercise = action(
  async <N extends ModuleNames>(
    exercise: Exercise<Module<N>["schema"]> & { name: N },
    step: keyof Module<N>["schema"]["steps"],
    form: FormData,
  ): Promise<Exercise<Module<N>["schema"]>> => {
    "use server";
    const schema = await getSchema(exercise.name);
    const attempt = [
      { step, state: Object.fromEntries(form.entries()) },
      ...exercise.attempt,
    ];
    const parsed = schema.parse({ ...exercise, attempt }) as Exercise<
      Module<N>["schema"]
    > & { name: N };
    return parsed;
  },
);

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type Attempt<N extends ModuleNames> = [
  Part<Module<N>["schema"]>,
  ...Part<Module<N>["schema"]>[],
];

export default function Exercise<N extends ModuleNames>(
  props: Optional<Exercise<Module<N>["schema"]>, "attempt"> & { name: N },
) {
  const [attempt, setAttempt] = createStore<Attempt<N> | []>(
    props.attempt || [],
  );
  const exercise = () => ({ ...props, attempt: attempt as Attempt<N> });
  createEffect(() => setAttempt(props.attempt || []));
  const submission = useSubmission(submitExercise);
  createEffect(() => {
    if (submission.result) {
      setAttempt(submission.result.attempt as unknown as Attempt<N>);
    }
  });

  const component = () => loadComponent(props.name);
  const grades = createAsync(
    async () => (attempt.length ? gradeExercise(exercise()) : []),
    { initialValue: [] },
  );
  const next = createMemo(() => {
    if (grades().length === 0) return "start" as const;
    return grades()[grades().length - 1]!.next;
  });
  return (
    <Suspense>
      <For each={attempt}>
        {(part, i) => {
          const feedback = createAsync(async () => {
            return getFeedback({
              ...props,
              attempt: attempt.slice(i()) as [
                Part<Module<N>["schema"]>,
                ...Part<Module<N>["schema"]>[],
              ],
            });
          });
          return (
            <fieldset disabled>
              <h3>Étape {i() + 1}</h3>
              <h4>{grades()?.[i()]?.score.join("/")}</h4>
              <Suspense fallback={<p>Correction en cours...</p>}>
                <Dynamic
                  component={component()}
                  {...props}
                  {...part}
                  feedback={feedback()}
                />
              </Suspense>
            </fieldset>
          );
        }}
      </For>
      <Show when={next()}>
        <h3>Étape {attempt.length + 1}</h3>
        {/* @ts-ignore */}
        <form method="post" action={submitExercise.with(exercise(), next())}>
          <Dynamic component={component()} {...props} step={next()} />
          <Show when={!submission.pending} fallback={<p>Soumission...</p>}>
            <button>Corriger</button>
          </Show>
        </form>
      </Show>
    </Suspense>
  );
}
