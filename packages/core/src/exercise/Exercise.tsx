import {
  createEffect,
  For,
  lazy,
  Show,
  Suspense,
  type Component,
  type ComponentProps,
  type JSX,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import type { View } from "./schemas";
import { createStore } from "solid-js/store";
import type {
  BaseExercise,
  createFeedbackFunction,
  GradedExercise,
  SchemaRegistry,
} from "./server";
import {
  createAsync,
  query,
  useSubmission,
  type Action,
} from "@solidjs/router";

export type ViewRegistry = Record<string, Component<any>>;
type Props<T extends View<any>> = ComponentProps<T[keyof T]>;

export function loadView<T extends View<any>>(
  importModule: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    const { default: view } = await importModule();
    return {
      default: ((props) => (
        <Dynamic component={view[props.step]} {...props} />
      )) as Component<Props<T>>,
    };
  });
}

export function createExercise<
  S extends SchemaRegistry,
  V extends ViewRegistry,
>(
  viewRegistry: V,
  grade: Action<[BaseExercise<S>, string, FormData], GradedExercise<S>>,
  getFeedback: ReturnType<
    typeof query<ReturnType<typeof createFeedbackFunction<S>>>
  >,
) {
  return function Exercise(props: BaseExercise<S>) {
    const submission = useSubmission(grade);
    const [attempt, setAttempt] = createStore<BaseExercise<S>["attempt"]>([]);
    createEffect(() => {
      if (props.attempt) {
        setAttempt(props.attempt);
      }
    });
    createEffect(() => {
      if (submission.result) {
        setAttempt(submission.result.attempt);
      }
    });

    const component = () => {
      if (!(props.name in viewRegistry))
        throw new Error(`View ${props.name} does not exist`);
      return viewRegistry[props.name];
    };

    const next = () => {
      if (attempt.length === 0) return "start";
      return attempt[attempt.length - 1]!.next;
    };

    return (
      <>
        <For each={attempt}>
          {(part, i) => {
            const feedback = createAsync(() =>
              getFeedback({ ...props, ...part }),
            );
            return (
              <Step index={i() + 1} disabled>
                <Suspense fallback="Correction en cours...">
                  <Dynamic
                    component={component()}
                    {...props}
                    {...part}
                    feedback={feedback}
                  />
                </Suspense>
              </Step>
            );
          }}
        </For>
        <Show when={next()}>
          <form method="post" action={grade.with(props, String(next()))}>
            <Step index={attempt.length + 1}>
              <Dynamic
                component={component()}
                {...props}
                step={next()}
                feedback={() => undefined}
              />
              <button>Submit</button>
            </Step>
          </form>
        </Show>
      </>
    );
  };
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
