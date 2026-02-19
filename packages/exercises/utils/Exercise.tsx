import { Dynamic } from "solid-js/web";
import { getFullFeedback, gradeExercise, type Module } from "./queries";
import registry from "./registry";
import type { Exercise, ExerciseTemplate, Part, View } from "./types";
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
import {
  action,
  createAsync,
  createAsyncStore,
  json,
  useSubmission,
} from "@solidjs/router";
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

const submitExerciseFn = async <N extends ModuleNames>(
  exercise: ExerciseTemplate<Module<N>["schema"]> & { name: N },
  step: keyof Module<N>["schema"]["steps"],
  form: FormData,
): Promise<ExerciseTemplate<Module<N>["schema"]>> => {
  "use server";
  const schema = await getSchema(exercise.name);
  const attempt = [
    { step, state: Object.fromEntries(form.entries()) },
    ...(exercise.attempt ?? []),
  ];
  const parsed = schema.parse({ ...exercise, attempt }) as typeof exercise;
  return parsed;
};

export default function Exercise<N extends ModuleNames>(
  props: ExerciseTemplate<Module<N>["schema"]> & { name: N },
) {
  const [attempt, setAttempt] = createStore<Part<Module<N>["schema"]>[]>([]);
  createEffect(() => setAttempt(props.attempt || []));
  const submitAction = action(submitExerciseFn<N>);
  const submission = useSubmission(submitAction);
  createEffect(() => {
    const result = submission.result as
      | Exercise<Module<N>["schema"]>
      | undefined;
    if (result) {
      setAttempt((current) => [result.attempt[0], ...current]);
    }
  });

  const component = () => loadComponent(props.name);
  const exercise = () => ({ ...props, attempt }) as typeof props;
  const grades = createAsyncStore(() => gradeExercise(exercise()));
  const feedback = createAsyncStore(() => getFullFeedback(exercise()));
  const next = createMemo(() => {
    if (grades()?.length === 0) return "start" as const;
    return grades()?.[0]!.next ?? null;
  });
  return (
    <div class="flex flex-col-reverse">
      <Show when={next()}>
        <Step index={attempt.length + 1}>
          <form method="post" action={submitAction.with(exercise(), next()!)}>
            <Dynamic component={component()} {...props} step={next()} />
            <Show when={!submission.pending} fallback={<p>Soumission...</p>}>
              <Button color="green">Corriger</Button>
            </Show>
          </form>
        </Step>
      </Show>
      <Suspense fallback={<p>Correction en cours...</p>}>
        <For each={attempt}>
          {(part, i) => (
            <Step
              index={attempt.length - i()}
              grade={grades()?.[i()]?.score}
              disabled
            >
              <Dynamic
                component={component()}
                {...props}
                {...part}
                feedback={feedback()?.[i()]}
              />
            </Step>
          )}
        </For>
      </Suspense>
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
        <Show when={props.grade?.[1] ?? 0 > 0}>
          <h4>{props.grade?.join("/")}</h4>
        </Show>
      </div>
      <div>{props.children}</div>
    </fieldset>
  );
}
