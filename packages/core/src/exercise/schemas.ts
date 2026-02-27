import type { Field } from "@learning/components";
import type { Component, ComponentProps } from "solid-js";
import * as v from "valibot";

type Infer<
  F extends (
    ...args: any[]
  ) => v.BaseSchema<any, any, any> | v.BaseSchemaAsync<any, any, any>,
  T extends "input" | "output" = "output",
> = T extends "output"
  ? v.InferOutput<ReturnType<F>>
  : T extends "input"
    ? v.InferInput<ReturnType<F>>
    : never;

type RawShape = Record<string, v.BaseSchema<any, any, any>>;

export type Schema = {
  name: string;
  question: RawShape;
  steps: Record<string, RawShape>;
};

type PartSchema<
  T extends Schema,
  K extends keyof T["steps"] & string,
> = v.ObjectSchema<
  {
    step: v.LiteralSchema<K, undefined>;
    state: v.ObjectSchema<T["steps"][K], undefined>;
  },
  undefined
>;

export function Part<
  const T extends Schema,
  const K extends keyof T["steps"] & string,
>(schema: T, step: K): PartSchema<T, K>;
export function Part<
  const T extends Schema,
  const K extends keyof T["steps"] & string,
>(
  schema: T,
  step?: K[],
): v.UnionSchema<
  { [S in keyof T["steps"] & string]: PartSchema<T, S> }[K][],
  undefined
>;
export function Part<
  const T extends Schema,
  const K extends keyof T["steps"] & string,
>(schema: T, steps?: K | K[]) {
  if (typeof steps === "string") {
    return v.object({
      step: v.literal(steps as K),
      state: v.object((schema.steps as T["steps"])[steps as K]!),
    });
  }
  return v.union(
    Object.keys(schema.steps)
      .filter((step) => steps?.includes(step as K) ?? true)
      .map((step) => Part(schema, step)) as {
      [K in keyof T["steps"]]: v.ObjectSchema<
        {
          step: v.LiteralSchema<K, undefined>;
          state: v.ObjectSchema<T["steps"][K], undefined>;
        },
        undefined
      >;
    }[K][],
  );
}
export type Part<
  T extends Schema,
  K extends keyof T["steps"] & string = keyof T["steps"] & string,
> = Infer<typeof Part<T, K>>;

export function Exercise<const T extends Schema>(schema: T) {
  return v.object({
    name: v.literal(schema.name as T["name"]),
    question: v.object(schema.question as T["question"]),
    attempt: v.array(Part(schema)),
  });
}
export type Exercise<T extends Schema> = Infer<typeof Exercise<T>>;

export function FeedbackInput<
  const T extends Schema,
  const K extends keyof T["steps"] & string,
>(schema: T, step: K) {
  return v.object({
    ...Part(schema, step).entries,
    ...Exercise(schema).entries,
  });
}
export type FeedbackInput<
  T extends Schema,
  K extends keyof T["steps"] & string,
> = Infer<typeof FeedbackInput<T, K>>;

export type Feedback<T extends Schema> = {
  [K in keyof T["steps"] & string]: (
    exercise: FeedbackInput<T, K>,
  ) => AsyncGenerator<[number, number] | keyof T["steps"] | null>;
};

export type FeedbackReturn<
  T extends Schema,
  F extends Feedback<T>,
  K extends keyof T["steps"] & string,
> = Promise<ReturnType<F[K]> extends AsyncGenerator<any, infer R> ? R : never>;

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type Props<
  T extends Schema,
  F extends Feedback<T>,
  K extends keyof T["steps"] & string = keyof T["steps"] & string,
> = Optional<
  FeedbackInput<T, K> & {
    feedback: () => Awaited<FeedbackReturn<T, F, K> | undefined>;
    field: {
      question: Record<keyof T["question"], Component>;
      state: Record<keyof T["steps"][K], Component>;
    };
  },
  "attempt" | "state"
>;

type Module = { schema: Schema; feedback: any };

export type View<T extends Module> = {
  [K in keyof T["schema"]["steps"] & string]: Component<
    Props<T["schema"], T["feedback"], K>
  >;
};
