import { Dynamic } from "solid-js/web";
import {
  createModel,
  type FeedbackPayload,
  type Part,
  type Schema,
} from "./schema";
import {
  createEffect,
  createMemo,
  For,
  lazy,
  Show,
  splitProps,
  type Component,
} from "solid-js";
import type z from "zod/v4";
import { mapValues } from "es-toolkit";
import { createStore } from "solid-js/store";
import { type Action } from "@solidjs/router";

export type Props<T extends Schema<any, any, any, any>> = z.output<
  ReturnType<
    typeof createModel<T["name"], T["question"], T["steps"], T["feedback"]>
  >["schema"]
>;

export type StepProps<
  T extends Schema<any, any, any, any>,
  K extends keyof T["steps"],
> = {
  question: z.infer<T["question"]>;
  state?: Part<T["steps"], K>["state"];
  score?: [number, number];
  feedback?: FeedbackPayload<T["feedback"], K>;
};

export type View<T extends Schema<any, any, any, any>> = {
  [K in keyof T["steps"]]: Component<StepProps<T, K>>;
};

type Submit = Action<
  [{ question: object, attempt: { step: string, state: object }[] }, string, FormData],
  any
>;

function createComponent<T extends Schema<any, any, any, any>>(
  view: View<T>,
): Component<Props<T> & { action: Submit }> {
  return function ExerciseComponent(fullProps) {
    const [others, props] = splitProps(fullProps, ["action"]);
    const next = createMemo(() => {
      const lastPart = props.attempt.at(-1);
      return lastPart ? lastPart.next : "start";
    });

    const [attempt, setAttempt] = createStore(props.attempt);
    createEffect(() => setAttempt(props.attempt));

    return (
      <>
        <For each={attempt}>
          {(part, i) => (
            <div>
              <h3>Étape {i() + 1}</h3>
              <Dynamic
                component={
                  view[part.step] as Component<StepProps<T, typeof part.step>>
                }
                question={props.question}
                {...part}
              />
            </div>
          )}
        </For>
        <Show when={next()}>
          <form
            method="post"
            action={others.action.with(props, next() as string)}
          >
            <h3>Étape {attempt.length + 1}</h3>
            <Dynamic component={view[next() as string]} question={props.question} />
          </form>
        </Show>
      </>
    );
  };
}

type Module<T extends Schema<any, any, any, any>> = {
  schema: T;
  default: View<T>;
};

type Register = Record<string, () => Promise<Module<any>>>;
type GlobalProps<R extends Register> = {
  [K in keyof R]: Props<Awaited<ReturnType<R[K]>>["schema"]>;
}[keyof R] & {
  action: Submit
};

export function createExerciseComponent<const R extends Register>(
  register: R,
): Component<GlobalProps<R>> {
  const components = mapValues(register, (importPromise) => {
    return lazy(async () => {
      const module = await importPromise();
      return { default: createComponent<typeof module.schema>(module.default) };
    });
  });
  return (fullProps) => {
    const [form, props] = splitProps(fullProps, ["action"]);
    return (
      <Dynamic
        component={components[props.name] as Component<GlobalProps<R>>}
        {...props}
        action={form.action}
      />
    );
  };
}
