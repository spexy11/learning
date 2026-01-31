import { defineSchema } from "@learning/core";
import z from "zod/v4";

export default defineSchema({
  name: "math/factor",
  question: {
    expr: z.string(),
  },
  steps: {
    start: { attempt: z.string() },
    root: { root: z.string() },
  },
  feedback: {
    start: async function* (question, state) {
      const [equal, factored] = await Promise.all([true, true]);
      yield [Number(equal && factored), 1];

      const incorrectRoots = true;
      if (incorrectRoots) yield "root";

      return { equal, factored };
    },
    root: async function* (question, step) {
      return { correct: false };
    },
  },
});
