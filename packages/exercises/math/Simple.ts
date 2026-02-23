import * as v from "valibot";
import { expr, type Feedback, type Schema } from "@learning/core";

export const schema = {
  name: "math/simple",
  question: {
    text: v.string(),
    answer: v.string(),
    label: v.string(),
    unit: v.string(),
  },
  steps: {
    start: { attempt: v.string() },
  },
} as const satisfies Schema;

export const feedback = {
  start: async function* ({ question, state }) {
    const equal = await expr(state.attempt).isEqual(question.answer);
    yield [Number(equal), 1];
    return { equal };
  },
} satisfies Feedback<typeof schema>;

export default { schema, feedback };
