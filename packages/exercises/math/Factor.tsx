import { defineSchema, expr, type View } from "@learning/core";
import z from "zod/v4";

export const schema = defineSchema({
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
        expr(state.attempt).isFactored(),
      ]);
      yield [Number(isEqual && isFactored), 1] as const;

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
  },
});

export default {
  start: (props) => (
    <>
      <p>
        Factorisez <strong>complètement</strong> {props.question.expr}.
      </p>
      <input value={props.state?.attempt} />
      {props.feedback?.correct}
    </>
  ),
} satisfies View<typeof schema>;
