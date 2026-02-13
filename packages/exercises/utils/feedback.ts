import { query } from "@solidjs/router";
import { loadModule, type registry, type Exercise } from "./registry";

export const getFeedback = query(
  async <N extends keyof typeof registry>(name: N, exercise: Exercise<N>) => {
    "use server";
    const module = await loadModule(name);
    return await module.feedback.extract("feedback", exercise);
  },
  "getFeedback",
);

export const grade = query(
  async <N extends keyof typeof registry>(name: N, exercise: Exercise<N>) => {
    "use server";
    const module = await loadModule(name);
    return await module.feedback.extract("grade", exercise);
  },
  "grade",
);
