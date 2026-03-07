import z from 'zod/v4'

import type { Expression as MathJson } from '@cortex-js/compute-engine'
import { ComputeEngine } from '@cortex-js/compute-engine'
import symapi from './symapi'

const ce = new ComputeEngine()

const integrateParams = z.union([
  z.tuple([z.string().default('x')]),
  z
    .tuple([z.string(), z.string().or(z.number()), z.string().or(z.number())])
    .transform(([x, a, b]) => [['Tuple', x, a, b]] as const),
])

function getMathJson(input: MathJson) {
  return typeof input === 'string' ? ce.parse(input).json : input
}

export function expr(input: MathJson) {
  const json = getMathJson(input)
  return {
    json,
    abs: () => expr(['Abs', json]),
    get args() {
      if (!Array.isArray(json)) throw new Error(`Only arrays have the property args`)
      return json.slice(1) as MathJson[]
    },
    checkRoot: (root: MathJson, x = 'x') =>
      expr(json)
        .subs({ [x]: root })
        .isEqual(0),
    commonRoots: (expr: MathJson) =>
      symapi.expr.commonRoots({ expr1: json, expr2: getMathJson(expr) }),
    diff: (x = 'x') => expr(['Derivative', json, x]),
    expand: () => expr(['Expand', json]),
    factor: () => expr(['Factor', json]),
    get func() {
      if (!Array.isArray(json)) throw new Error(`Only arrays have the property func`)
      return json[0] as string
    },
    integrate: (...params: z.input<typeof integrateParams>) =>
      expr(['Integrate', json, ...integrateParams.parse(params)]),
    isSubtraction: () => {
      if (!Array.isArray(json) || json[0] !== 'Add' || json.length !== 3) return false
      return isNegative(json[1]) || isNegative(json[2])
    },
    isEqual: (expr: MathJson) => symapi.expr.equal({ expr1: json, expr2: getMathJson(expr) }),
    isFactored: () => symapi.expr.isFactored({ expr: json }),
    isSquare: async () => {
      const factored = expr(await expr(json).factor().latex())
      return factored.func === 'Power' && factored.args[1] === 2
    },
    latex: () => symapi.expr.latex({ expr: json }),
    matches: (expr: MathJson) => symapi.expr.match({ expr1: json, expr2: getMathJson(expr) }),
    roots: () => symapi.expr.roots({ expr: json }),
    simplify: () => expr(['Simplify', json]),
    subs: (substitutions: Record<string, MathJson>) => expr(ce.box(json).subs(substitutions).json),
  }
}

function isNegative(expr: MathJson): boolean {
  if (typeof expr === 'number') return expr < 0
  if (Array.isArray(expr) && expr[0] === 'Negate') return true
  if (Array.isArray(expr) && expr[0] === 'Multiply') return isNegative(expr[1])
  return false
}
