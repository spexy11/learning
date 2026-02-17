import { expect, test } from "bun:test";

import { expr } from "./expr";

test.each([
  {
    desc: "(x - 2)(x - 3) = x^2 - 5x + 6",
    promise: expr("(x - 2)(x - 3)").isEqual("x^2 - 5x + 6"),
    result: true,
  },
  {
    desc: "diff((x - 2)(x - 3)) = 2x - 5",
    promise: expr("(x - 2)(x - 3)").diff().isEqual("2x - 5"),
    result: true,
  },
  {
    desc: "sin^2 x + cos^2 x = 1",
    promise: expr("\\sin^2{x} + \\cos^2{x}").isEqual("1"),
    result: true,
  },
  {
    desc: "int x dx = x^2 / 2",
    promise: expr("x").integrate().isEqual("\\frac{x^2}{2}"),
    result: true,
  },
  {
    desc: "int_0^1 x dx = 1/2",
    promise: expr("x").integrate("x", 0, 1).isEqual("\\frac{1}{2}"),
    result: true,
  },
  {
    desc: "i^2 = -1",
    promise: expr("i^2").isEqual(-1),
    result: true,
  },
  {
    desc: "1 + i = sqrt(2) e^{i pi / 4}",
    promise: expr("1 + i").isEqual("\\sqrt{2} e^{i \\frac{\\pi}{4}}"),
    result: true,
  },
  {
    desc: "cos x + i sin x = e^{i x}",
    promise: expr("\\cos x + i \\sin x").isEqual("e^{i x}"),
    result: true,
  },
])("symbolic equality check: $desc", async ({ promise, result }) => {
  expect(await promise).toBe(result);
});

test.each([
  {
    desc: "diff((x - 2)(x - 3)) = 2x - 5",
    promise: expr("(x-2)(x - 3)").diff().latex(),
    result: "2 x - 5",
  },
  {
    desc: "(sin x)' = cos x",
    promise: expr("\\sin{x}").diff().latex(),
    result: String.raw`\cos{\left(x \right)}`,
  },
  {
    desc: "factor(x^2 - 5x + 6) = (x - 2)(x - 3)",
    promise: expr("x^2 - 5x + 6").factor().latex(),
    result: String.raw`\left(x - 3\right) \left(x - 2\right)`,
  },
])("getLatex works correctly: $desc", async ({ promise, result }) => {
  expect(await promise).toBe(result);
});

test.each([
  {
    desc: "x^2 - 4 = (a + b) (a - b)",
    promise: expr("x^2 - 4").matches("(a + b) (a - b)"),
    result: true,
  },
  {
    desc: "x^2 - 4 = (a + b)^2",
    promise: expr("x^2 - 4").matches("(a + b)^2"),
    result: false,
  },
  {
    desc: "x^2 + 2x + 1 = (a + b)^2",
    promise: expr("x^2 + 2x + 1").matches("(a + b)^2"),
    result: true,
  },
])("pattern matching works correctly: $desc", async ({ promise, result }) => {
  expect(await promise).toBe(result);
});
