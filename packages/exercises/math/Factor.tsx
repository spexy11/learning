import { defineSchema, expr, type View } from "@learning/core";
import z from "zod/v4";
import { CheckMark } from '@learning/components'

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
  },
});

export default {
  start: (props) => (
    <>
      <p>
        Factorisez <strong>complètement</strong> {props.question.expr}.
      </p>
      <input name="attempt" value={props.state?.attempt} />
      <CheckMark correct={props.feedback?.correct} />
      <pre>{JSON.stringify(props.feedback, null, 2)}</pre>
    </>
  ),
} satisfies View<typeof schema>;
