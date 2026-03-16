import * as v from 'valibot'

import { type MathJsonExpression, ComputeEngine } from '@cortex-js/compute-engine'
import symapi from './symapi'

const ce = new ComputeEngine()

const integrateParams = v.union([
  v.tuple([v.optional(v.string(), 'x')]),
  v.pipe(
    v.tuple([v.string(), v.union([v.string(), v.number()]), v.union([v.string(), v.number()])]),
    v.transform(([x, a, b]) => [['Tuple', x, a, b]] as const),
  ),
])

function getMathJson(input?: MathJsonExpression) {
  if (!input) return ''
  return typeof input === 'string' ? ce.parse(input).json : input
}

export function expr(input?: MathJsonExpression) {
  const json = getMathJson(input)
  return {
    json,
    abs: () => expr(['Abs', json]),
    get args() {
      if (!Array.isArray(json)) throw new Error(`Only arrays have the property args`)
      return json.slice(1) as MathJsonExpression[]
    },
    checkRoot: (root: MathJsonExpression, x = 'x') =>
      expr(json)
        .subs({ [x]: root })
        .isEqual(0),
    commonRoots: (expr: MathJsonExpression) =>
      symapi.expr.commonRoots({ expr1: json, expr2: getMathJson(expr) }),
    diff: (x = 'x') => expr(['Derivative', json, x]),
    expand: () => expr(['Expand', json]),
    factor: () => expr(['Factor', json]),
    get func() {
      if (!Array.isArray(json)) throw new Error(`Only arrays have the property func`)
      return json[0] as string
    },
    integrate: (...params: v.InferInput<typeof integrateParams>) =>
      expr(['Integrate', json, ...v.parse(integrateParams, params)]),
    isSubtraction: () => {
      if (!Array.isArray(json) || json[0] !== 'Add' || json.length !== 3) return false
      return isNegative(json[1]) || isNegative(json[2])
    },
    isEqual: (expr: MathJsonExpression) =>
      symapi.expr.equal({ expr1: json, expr2: getMathJson(expr) }),
    isFactored: () => symapi.expr.isFactored({ expr: json }),
    isSquare: async () => {
      const factored = expr(await expr(json).factor().latex())
      return factored.func === 'Power' && factored.args[1] === 2
    },
    latex: () => symapi.expr.latex({ expr: json }),
    matches: (expr: MathJsonExpression) =>
      symapi.expr.match({ expr1: json, expr2: getMathJson(expr) }),
    roots: (complex = false) => symapi.expr.roots({ expr: json, complex }),
    simplify: () => expr(['Simplify', json]),
    subs: (substitutions: Record<string, MathJsonExpression>) =>
      expr(ce.expr(json).subs(substitutions).json),
  }
}

function isNegative(expr: MathJsonExpression): boolean {
  if (typeof expr === 'number') return expr < 0
  if (Array.isArray(expr) && expr[0] === 'Negate') return true
  if (Array.isArray(expr) && expr[0] === 'Multiply') return isNegative(expr[1])
  return false
}
