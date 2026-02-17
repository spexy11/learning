import { expr } from "@learning/core";
import z from "zod/v4";
import type { Feedback, Schema } from "../../utils/types";
import { mapAsync } from "es-toolkit";

export const schema = {
  name: "math/factor",
  question: {
    expr: z.string(),
  },
  steps: {
    start: { attempt: z.string() },
    binomial: { attempt: z.string() },
    root: { root: z.string() },
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
  start: async function* ({ question, attempt: [{ state }] }) {
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
    yield await Promise.all([grade, next]);

    return await resolve({
      expanded: expr(state.attempt).expand().latex(),
      correct,
      isEqual,
      isFactored,
    });
  },
  binomial: async function* ({ question, attempt: [{ state }] }) {
    yield [0, 0];
  },
  root: async function* ({ question, attempt: [{ state }] }) {
    yield [0, 0];
  },
} satisfies Feedback<typeof schema>;
