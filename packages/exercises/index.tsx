import {
  createExerciseComponent,
  createFeedbackFunction,
  createModel,
} from "@learning/core";
import z from "zod";
import { schema as mathFactorSchema } from "./math/Factor";
import { action } from "@solidjs/router";
import type { ComponentProps } from "solid-js";

const modules = {
  "math/factor": () => import("./math/Factor"),
} as const;

export const schema = z.discriminatedUnion("name", [
  createModel(mathFactorSchema).schema,
]);

export async function grade(
  exercise: z.input<typeof schema>,
  step: string,
  form: FormData,
) {
  const state = Object.fromEntries(form.entries());
  const modifiedExercise = {
    ...exercise,
    attempt: [...(exercise.attempt ?? []), { step, state }],
  };
  const graded = await schema.parseAsync(modifiedExercise);
  return graded;
}

const submit: typeof grade = async (exercise, step, form) => {
  "use server";
  return await grade(exercise, step, form);
}

const fn = createFeedbackFunction(modules);
export const feedback: typeof fn = (...args) => {
  "use server";
  return fn(...args);
};

const ExerciseComponent = createExerciseComponent(modules);

export function Exercise(
  props: Omit<ComponentProps<typeof ExerciseComponent>, "feedback" | "action">,
) {
  return (
    <ExerciseComponent
      action={action(submit)}
      {...props}
      feedback={(name, question, part, prev) =>
        feedback(name, question, part, prev)
      }
    />
  );
}
