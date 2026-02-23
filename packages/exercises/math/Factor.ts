import { expr, type Feedback, type Schema } from "@learning/core";
import { mapAsync } from "es-toolkit";
import * as v from "valibot";

export const schema = {
  name: "math/factor",
  question: {
    expr: v.string(),
  },
  steps: {
    start: { attempt: v.string() },
    binomial: { attempt: v.string() },
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
    const isEqual = expr(state.attempt).isEqual(question.expr);
    const isFactored = expr(state.attempt).isFactored();
    const correct = resolve({ isEqual, isFactored }).then(
      (d) => d.isEqual && d.isFactored,
    );

    const grade = correct.then((c) => [Number(c), 1] as [number, number]);
    const next = resolve({
      correct,
      squaredSum: expr(question.expr).matches("(a + b)^2"),
      conj: expr(question.expr).matches("(a + b)(a - b)"),
    }).then((d) => {
      if (d.correct) return null;
      else if (d.squaredSum || d.conj) return "binomial";
      else return "root";
    });
    const [score, nextStep] = await Promise.all([grade, next]);
    yield score;
    yield nextStep;

    return await resolve({
      expanded: expr(state.attempt).expand().latex(),
      correct,
      isEqual,
      isFactored,
    });
  },
  binomial: async function* () {
    yield [0, 0];
  },
  root: async function* () {
    yield [0, 0];
  },
} satisfies Feedback<typeof schema>;

export default { schema, feedback };
