import { createExerciseComponent, createModel } from "@learning/core";
import z from "zod";
import { schema as mathFactorSchema } from "./math/Factor";
import type { Action as RouterAction } from "@solidjs/router";

const modules = {
  "math/factor": () => import("./math/Factor"),
} as const;

export const schema = z.discriminatedUnion("name", [
  createModel(mathFactorSchema).schema,
]);

export type Action = RouterAction<
  [
    {
      name: string;
      question: object;
      attempt: { step: string; state: object }[];
    },
    string,
    FormData,
  ],
  any
>;

export async function grade(
  exercise: { attempt: unknown[] },
  step: string,
  form: FormData,
) {
  const state = Object.fromEntries(form.entries());
  const modifiedExercise = {
    ...exercise,
    attempt: [...exercise.attempt ?? [], { step, state }],
  };
  const graded = await schema.parseAsync(modifiedExercise);
  return graded;
}

export const Exercise = createExerciseComponent(modules);
