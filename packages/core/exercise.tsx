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
import { createAsync, useSubmission, type Action } from "@solidjs/router";

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

export type Submit<T extends Schema<any, any, any, any>> = Action<
  [Props<T>, string, FormData],
  any
>;

export type Feedback<T extends Schema<any, any, any, any>> = <
  K extends keyof T["steps"],
>(
  question: z.output<T["question"]>,
  part: Part<T, K>,
  previous: Part<T>[],
) => Promise<FeedbackPayload<T["feedback"], K>>;

type FinalComponent<T extends Schema<any, any, any, any>> = Component<
  Props<T> & {
    action: Submit<T>;
    feedback: Feedback<T>;
  }
>;

function createComponent<T extends Schema<any, any, any, any>>(
  view: View<T>,
): FinalComponent<T> {
  return function ExerciseComponent(fullProps) {
    const [others, props] = splitProps(fullProps, ["action", "feedback"]);

    const submission = useSubmission(others.action);
    const [attempt, setAttempt] = createStore(props.attempt);
    createEffect(() => setAttempt(props.attempt));
    createEffect(() => {
      if (submission.result) {
        setAttempt(submission.result.attempt);
      }
    });

    const next = createMemo(() => {
      const lastPart = attempt[attempt.length - 1];
      return lastPart !== undefined ? lastPart.next : "start";
    });

    return (
      <>
        <For each={attempt}>
          {(part, i) => {
            const feedback = createAsync(() =>
              others.feedback(
                props.question,
                part as Part<T, typeof part.step>,
                attempt.splice(0, i()),
              ),
            );
            return (
              <div>
                <h3>Étape {i() + 1}</h3>
                <fieldset disabled>
                  <Dynamic
                    component={
                      view[part.step] as Component<
                        StepProps<T, typeof part.step>
                      >
                    }
                    question={props.question}
                    feedback={feedback()}
                    {...part}
                  />
                </fieldset>
              </div>
            );
          }}
        </For>
        <Show when={next()}>
          <form
            method="post"
            action={others.action.with(props, next() as string)}
          >
            <h3>Étape {attempt.length + 1}</h3>
            <Dynamic
              component={view[next() as string]}
              question={props.question}
            />
            <button>Submit</button>
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

export type Register = Record<string, () => Promise<Module<any>>>;

export type RegisterSchema<R extends Register, K extends keyof R> = Awaited<
  ReturnType<R[K]>
>["schema"];

export type RegisterAction<R extends Register> = Action<
  [GlobalProps<R>, string, FormData],
  GlobalProps<R>
>;

export type RegisterFeedback<R extends Register> = <
  N extends keyof R,
  K extends keyof RegisterSchema<R, N>["steps"],
>(
  name: N,
  question: Extract<GlobalProps<R>, { name: N }>["question"],
  part: Part<RegisterSchema<R, N>, K>,
  previous: z.infer<
    RegisterSchema<R, N>["steps"][keyof RegisterSchema<R, N>["steps"]]["state"]
  >[],
) => Promise<FeedbackPayload<RegisterSchema<R, N>["feedback"], K>>;

export type GlobalProps<R extends Register> = {
  [K in keyof R]: Props<RegisterSchema<R, K>>;
}[keyof R];

export function createExerciseComponent<const R extends Register>(
  register: R,
): Component<
  GlobalProps<R> & {
    action: RegisterAction<R>;
    feedback: RegisterFeedback<R>;
  }
> {
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
        component={
          components[props.name] as FinalComponent<
            RegisterSchema<R, typeof props.name>
          >
        }
        {...props}
        action={form.action}
        feedback={(question, part, previous) =>
          props.feedback(props.name, question, part, previous)
        }
      />
    );
  };
}
