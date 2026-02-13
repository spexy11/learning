import { defineFeedback, defineSchema, expr } from "@learning/core";
import z from "zod/v4";

export const schema = defineSchema({
  name: "math/factor",
  question: {
    expr: z.string(),
  },
  steps: {
    start: { attempt: z.string() },
  },
});

export const feedback = defineFeedback(schema, {
  start: async function* ({ question, attempt: [part] }) {
    const [isEqual, isFactored] = await Promise.all([
      expr(part.state.attempt).isEqual(question.expr),
      expr(part.state.attempt).isFactored(),
    ]);
    yield [Number(isEqual && isFactored), 1];

    const [expanded] = await Promise.all([
      expr(part.state.attempt).expand().latex(),
    ]);
    return {
      correct: isFactored && isEqual,
      expanded,
      isEqual,
      isFactored,
    };
  },
});
