import registry from "./registry";
import { buildSchema, getSchema } from "./schema";
import type { z } from "zod/v4";
import type { Exercise, Feedback, FeedbackReturn, Schema } from "./types";
import { memoize } from "es-toolkit";
import { query } from "@solidjs/router";

async function extractFeedback<
  T extends Schema,
  F extends Feedback<T>,
  K extends keyof T["steps"] & string,
>(
  schema: T,
  feedback: F,
  info: "feedback",
  rawExercise: Exercise<T, K> & Exercise<T, string>,
): Promise<FeedbackReturn<F[K]>>;
async function extractFeedback<
  T extends Schema,
  F extends Feedback<T>,
  K extends keyof T["steps"] & string,
>(
  schema: T,
  feedback: F,
  info: "grade",
  rawExercise: Exercise<T, K> & Exercise<T, string>,
): Promise<{ next: keyof T["steps"] | null; score: [number, number] }>;
async function extractFeedback<
  T extends Schema,
  F extends Feedback<T>,
  K extends keyof T["steps"] & string,
>(
  schema: T,
  feedback: F,
  info: "grade" | "feedback",
  rawExercise: Exercise<T, K> & Exercise<T, string>,
) {
  "use server";
  const exercise = await buildSchema(schema).parseAsync(rawExercise);
  const step = rawExercise.attempt[0].step;
  const generator = feedback[step](exercise as any);
  let score: [number, number] = [0, 0];
  let next: keyof T["steps"] | null = null;
  while (true) {
    const { value, done } = await generator.next();
    if (done) {
      if (info === "feedback") return value;
      return { score, next };
    }
    if (Array.isArray(value))
      score = [score[0] + value[0], score[1] + value[1]];
    else next = value;
  }
}

const getModule = memoize(
  async <N extends keyof (typeof registry)["server"]>(
    name: N,
  ): Promise<
    (typeof registry)["server"][N] extends () => Promise<{
      schema: infer T extends Schema;
      feedback: infer F extends Feedback<any>;
    }>
      ? { schema: T; feedback: F }
      : never
  > => {
    const { schema, feedback } = await registry.server[name]();
    return { schema, feedback } as any;
  },
);

export const getFeedback = query(
  async <
    N extends keyof (typeof registry)["server"],
    K extends z.infer<
      Awaited<ReturnType<typeof getSchema<N>>>
    >["attempt"][number]["step"],
  >(
    name: N,
    rawExercise: z.infer<Awaited<ReturnType<typeof getSchema<N>>>> & {
      name: N;
      attempt: [{ step: K }];
    },
  ): Promise<
    (typeof registry)["server"][N] extends () => Promise<{
      feedback: infer F extends Record<K, any>;
    }>
      ? FeedbackReturn<F[K]>
      : never
  > => {
    "use server";
    const { schema, feedback } = await getModule(name);
    return await extractFeedback(schema, feedback, "feedback", rawExercise);
  },
  "getFeedback",
);

const test = await getFeedback("math/factor", {
  name: "math/factor",
  question: { expr: "x^2" },
  attempt: [{ step: "start", state: { attempt: "x^3" } }],
});
