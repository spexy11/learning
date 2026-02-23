import {
  createEffect,
  For,
  lazy,
  Show,
  type Component,
  type ComponentProps,
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
import { query, useSubmission, type Action } from "@solidjs/router";

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
  feedback: ReturnType<
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
          {(part) => <Dynamic component={component()} {...props} {...part} />}
        </For>
        <Show when={next()}>
          <form method="post" action={grade.with(props, "start")}>
            <Dynamic component={component()} {...props} step={next()} />
            <button>Submit</button>
          </form>
        </Show>
      </>
    );
  };
}
