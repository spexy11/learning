import { defineSchema, expr } from "@learning/core";
import z from "zod/v4";

const schema = defineSchema({
  name: "math/factor",
  question: z.object({
    expr: z.string(),
  }),
  steps: {
    start: { attempt: z.string() },
  },
  feedback: {
    start: async function* (question, state) {
      const [isEqual, isFactored] = await Promise.all([
        expr(state.attempt).isEqual(question.expr),
        expr(state.attempt).isFactored,
      ]);
      yield [Number(isEqual && isFactored), 1];

      const [expanded] = await Promise.all([
        expr(state.attempt).expand().latex()
      ])
      return {
        expanded,
        isEqual,
        isFactored
      }
    },
  },
});
