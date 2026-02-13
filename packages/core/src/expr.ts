import z from "zod/v4";

import { ComputeEngine } from "@cortex-js/compute-engine";
import type { Expression as MathJson } from "@cortex-js/compute-engine";
import symapi from "./symapi";

const ce = new ComputeEngine();

const integrateParams = z.union([
  z.tuple([z.string().default("x")]),
  z
    .tuple([z.string(), z.string().or(z.number()), z.string().or(z.number())])
    .transform(([x, a, b]) => [["Tuple", x, a, b]] as const),
]);

function getMathJson(input: string | MathJson) {
  return typeof input === "string" ? ce.parse(input).json : input;
}

export function expr(input: string | MathJson) {
  const json = getMathJson(input);
  return {
    json,
    abs: () => expr(["Abs", json]),
    diff: (x = "x") => expr(["Derivative", json, x]),
    expand: () => expr(["Expand", json]),
    factor: () => expr(["Factor", json]),
    integrate: (...params: z.input<typeof integrateParams>) =>
      expr(["Integrate", json, ...integrateParams.parse(params)]),
    isEqual: (expr: string | MathJson) =>
      symapi.expr.equal({ expr1: json, expr2: getMathJson(expr) }),
    isFactored: () => symapi.expr.isFactored({ expr: json }),
    latex: () => symapi.expr.latex({ expr: json }),
  };
}
