import { expr } from "@learning/core";
import z from "zod/v4";
import type { Feedback, Schema } from "@/utils/types";

export const schema = {
  name: "math/factor",
  question: {
    expr: z.string(),
  },
  steps: {
    start: { attempt: z.string() },
  },
} as const satisfies Schema;

export const feedback = {
  start: async function* ({ question, attempt: [{ state }] }) {
    const [isEqual, isFactored] = await Promise.all([
      expr(state.attempt).isEqual(question.expr),
      expr(state.attempt).isFactored(),
    ]);
    yield [Number(isEqual && isFactored), 1];

    const [expanded] = await Promise.all([
      expr(state.attempt).expand().latex(),
    ]);
    return {
      correct: isFactored && isEqual,
      expanded,
      isEqual,
      isFactored,
    };
  },
} satisfies Feedback<typeof schema>;
