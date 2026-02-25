import { expr, type Feedback, type Schema } from "@learning/core";
import { mapAsync } from "es-toolkit";
import * as v from "valibot";

export const schema = {
  name: "math/factor",
  question: {
    expr: {
      type: "latex",
      label: "Expression",
      description: "L'expression à factoriser",
    },
  },
  steps: {
    start: { attempt: v.string() },
    binomial: { type: v.union([v.literal("square"), v.literal("conjugate")]) },
    root: { root: v.string() },
  },
} as const satisfies Schema;

async function resolve<T extends Record<string, Promise<any> | any>>(
  promises: T,
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  return Object.fromEntries(
    await mapAsync(Object.entries(promises), async ([key, promise]) => {
      return [key, await promise];
    }),
  ) as any;
}

export const feedback = {
  start: async function* ({ question, state }) {
    const isEqual = await expr(state.attempt).isEqual(question.expr);
    const isFactored = await expr(state.attempt).isFactored();
    const correct = isEqual && isFactored;
    yield [Number(correct), 1];

    const squaredSum = await expr(question.expr).matches("(a + b)^2");
    const conj = await expr(question.expr).matches("(a + b)(a - b)");
    if (correct) yield null;
    else if (squaredSum || conj) yield "binomial";
    else yield "root";

    return await resolve({
      expanded: expr(state.attempt).expand().latex(),
      correct,
      isEqual,
      isFactored,
    });
  },
  binomial: async function* ({ question, state }) {
    const conjugate = expr(question.expr).matches("(a + b)(a - b)");
    const correct = await conjugate.then(
      (c) => (state.type === "conjugate") === c,
    );
    yield [0, 0];
    yield correct ? "start" : null;
    return { correct };
  },
  root: async function* () {
    yield [0, 0];
  },
} satisfies Feedback<typeof schema>;

export default { schema, feedback };
