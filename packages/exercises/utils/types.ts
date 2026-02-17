import type { Component } from "solid-js";
import z from "zod/v4";

export type Schema = {
  name: string;
  question: z.ZodRawShape;
  steps: Record<string, z.ZodRawShape> & { start: any };
};

export type Part<
  T extends Schema,
  K extends keyof T["steps"] = keyof T["steps"],
> = {
  [S in keyof T["steps"]]: {
    step: S;
    state: z.output<z.ZodObject<T["steps"][S]>>;
  };
}[K];

export type Exercise<
  T extends Schema,
  K extends keyof T["steps"] = keyof T["steps"],
> = {
  name: T["name"];
  question: z.output<z.ZodObject<T["question"]>>;
  attempt: [Part<T, K>, ...Part<T>[]];
};

export type Feedback<T extends Schema> = {
  [K in keyof T["steps"]]: (
    exercise: Exercise<T, K>,
  ) => AsyncGenerator<
    | [number, number]
    | keyof T["steps"]
    | null
    | [[number, number], keyof T["steps"] | null],
    any
  >;
};

export type FeedbackReturn<T extends (...args: any[]) => AsyncGenerator> =
  ReturnType<T> extends AsyncGenerator<any, infer R> ? R : never;

export type View<
  M extends {
    schema: Schema;
    feedback: any;
  },
> = {
  [K in keyof M["schema"]["steps"]]: Component<
    Exercise<M["schema"], K> &
      Partial<{
        state: Part<M["schema"], K>["state"];
        feedback: FeedbackReturn<M["feedback"][K]>;
      }>
  >;
};
