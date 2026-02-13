import { query } from "@solidjs/router";
import registry, { type Exercise, type Module } from "./registry";

let cache: Partial<{ [K in keyof typeof registry]: Module<K> }> = {};

export const getFeedback = query(
  async <N extends keyof typeof registry>(name: N, exercise: Exercise<N>) => {
    "use server";
    if (!cache[name]) cache[name] = await registry[name]();
    exercise = cache[name].schema.parse(exercise) as Exercise<N>;
    return await cache[name].feedback.extract("feedback", exercise);
  },
  "getFeedback",
);

export const grade = query(
  async <N extends keyof typeof registry>(name: N, exercise: Exercise<N>) => {
    "use server";
    if (!cache[name]) cache[name] = await registry[name]();
    exercise = cache[name].schema.parse(exercise) as Exercise<N>;
    return await cache[name].feedback.extract("grade", exercise);
  },
  "grade",
);
