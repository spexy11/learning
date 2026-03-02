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

function getMathJson(input: MathJson) {
  return typeof input === "string" ? ce.parse(input).json : input;
}

export function expr(input: MathJson) {
  const json = getMathJson(input);
  return {
    json,
    abs: () => expr(["Abs", json]),
    checkRoot: (root: MathJson, x = "x") =>
      expr(json)
        .subs({ [x]: root })
        .isEqual(0),
    commonRoots: (expr: MathJson) =>
      symapi.expr.commonRoots({ expr1: json, expr2: getMathJson(expr) }),
    diff: (x = "x") => expr(["Derivative", json, x]),
    expand: () => expr(["Expand", json]),
    factor: () => expr(["Factor", json]),
    integrate: (...params: z.input<typeof integrateParams>) =>
      expr(["Integrate", json, ...integrateParams.parse(params)]),
    isEqual: (expr: MathJson) =>
      symapi.expr.equal({ expr1: json, expr2: getMathJson(expr) }),
    isFactored: () => symapi.expr.isFactored({ expr: json }),
    latex: () => symapi.expr.latex({ expr: json }),
    matches: (expr: MathJson) =>
      symapi.expr.match({ expr1: json, expr2: getMathJson(expr) }),
    roots: () => symapi.expr.roots({ expr: json }),
    subs: (substitutions: Record<string, MathJson>) =>
      expr(ce.box(json).subs(substitutions).json),
  };
}
