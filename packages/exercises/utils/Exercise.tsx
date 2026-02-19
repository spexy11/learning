import { Dynamic } from "solid-js/web";
import { getFeedback, gradeExercise, type Module } from "./queries";
import registry from "./registry";
import type { Exercise, Part, View } from "./types";
import {
  createEffect,
  createMemo,
  For,
  type JSX,
  lazy,
  Show,
  Suspense,
  type Component,
} from "solid-js";
import { createStore } from "solid-js/store";
import { action, createAsync, useSubmission } from "@solidjs/router";
import { getSchema } from "./schema";
import { Button } from "@learning/components";

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
    return grades()[0]!.next;
  });
  return (
    <div class="flex flex-col-reverse">
      <Show when={next()}>
        <Step index={attempt.length + 1}>
          {/* @ts-ignore */}
          <form method="post" action={submitExercise.with(exercise(), next())}>
            <Dynamic component={component()} {...props} step={next()} />
            <Show when={!submission.pending} fallback={<p>Soumission...</p>}>
              <Button color="green">Corriger</Button>
            </Show>
          </form>
        </Step>
      </Show>
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
            <Step index={i() + 1} grade={grades()?.[i()]?.score} disabled>
              <Suspense fallback={<p>Correction en cours...</p>}>
                <Dynamic
                  component={component()}
                  {...props}
                  {...part}
                  feedback={feedback()}
                />
              </Suspense>
            </Step>
          );
        }}
      </For>
    </div>
  );
}

function Step(props: {
  children: JSX.Element;
  disabled?: boolean;
  grade?: [number, number];
  index: number;
}) {
  return (
    <fieldset
      class="container rounded-xl my-4 mx-auto p-4 shadow-sm"
      classList={{
        "bg-blue-50 hover:bg-blue-100": !props.disabled,
        "bg-white hover:bg-slate-50": props.disabled === true,
      }}
      disabled={props.disabled === true}
    >
      <div class="flex justify-between">
        <h3 class="text-sky-900 text-xl font-bold mb-3">Étape {props.index}</h3>
        <Show when={props.grade && props.grade?.[1] > 0}>
          <h4>{props.grade?.join("/")}</h4>
        </Show>
      </div>
      <div>{props.children}</div>
    </fieldset>
  );
}
