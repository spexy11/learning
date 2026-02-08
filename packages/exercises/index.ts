import { createExerciseComponent } from "@learning/core";

export const modules = {
  Factor: () => import("./math/Factor"),
} as const;

export const Exercise = createExerciseComponent(modules);
