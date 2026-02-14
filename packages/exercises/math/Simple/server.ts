import z from "zod/v4";
import type { Feedback, Schema } from "../../utils/types";
import { expr } from "@learning/core";

export const schema = {
  name: "math/simple",
  question: {
    text: z.string(),
    answer: z.string(),
    label: z.string(),
    unit: z.string(),
  },
  steps: {
    start: { attempt: z.string() },
  },
} as const satisfies Schema;

export const feedback = {
  start: async function* ({ question, attempt: [{ state }] }) {
    const equal = await expr(state.attempt).isEqual(question.answer);
    yield [Number(equal), 1];
    return { equal };
  },
} satisfies Feedback<typeof schema>;
