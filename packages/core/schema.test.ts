import { createModel, defineSchema } from ".";
import z from "zod/v4";
import { expect, test } from "bun:test";

const schema = defineSchema({
  name: "math/factor",
  question: z
    .object({
      expr: z.string(),
      expand: z.boolean().default(false),
    })
    .transform(({ expand, expr }) => {
      if (expand) expr = `expand(${expr})`;
      return { expr, expand: false };
    }),
  steps: { start: { attempt: z.string() } },
  feedback: {
    start: async function* (question, state) {
      yield [1, 1];
    },
  },
});

const model = createModel(schema);

type Input = z.input<typeof model.schema>;

test("generator works", async () => {
  const input: Input = {
    name: "math/factor",
    params: {
      x: ["sampleSize", [1, 1, 1], 2],
    },
    question: {
      expr: "(x - `x.0`) (x - `x.1`)",
      expand: true,
    },
  };
  const exercise = await model.schema.parseAsync(input);
  expect(exercise.question.expr).toBe(`expand((x - 1) (x - 1))`);
  expect("params" in exercise).toBe(false);
});

test("grading works", async () => {
  const input = {
    name: "math/factor",
    question: {
      expr: "x^2 - 3x + 2",
      expand: false,
    },
    attempt: [
      {
        step: "start",
        state: { attempt: "(x - 1)(x - 2)" },
      },
    ],
  } as const satisfies Input;
  const attempt = [
    { ...input.attempt[0], next: null, score: [1, 1] as [number, number]},
  ];
  const exercise = await model.schema.parseAsync(input);
  expect(exercise.attempt).toEqual(attempt);
  expect(exercise).toEqual({...input, attempt })
});
