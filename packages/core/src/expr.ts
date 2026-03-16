import * as v from 'valibot'

import { type MathJsonExpression, ComputeEngine } from '@cortex-js/compute-engine'
import symapi from './symapi'

const ce = new ComputeEngine()

const integrateParams = v.union([
  v.pipe(
    v.strictTuple([]),
    v.transform(() => ['x']),
  ),
  v.strictTuple([v.string()]),
  v.pipe(
    v.strictTuple([v.string(), v.number(), v.number()]),
    v.transform(([x, a, b]) => [['Tuple', x, a, b]] as const),
  ),
])

const Math: v.GenericSchema<MathJsonExpression> = v.union([
  v.pipe(
    v.string(),
    v.transform((input) => ce.parse(input).json),
  ),
  v.number(),
  v.tupleWithRest(
    [v.string()],
    v.lazy(() => Math),
  ),
])
type Math = v.InferInput<typeof Math>

function _expr(input: Math) {
  const json = v.parse(Math, input)
  return {
    json,
    abs: () => expr(['Abs', json]),
    get args() {
      if (!Array.isArray(json)) throw new Error(`Only arrays have the property args`)
      return json.slice(1) as Math[]
    },
    checkRoot: (root: Math, x = 'x') =>
      expr(json)
        .subs({ [x]: root })
        .isEqual(0),
    commonRoots: (expr: Math) =>
      symapi.expr.commonRoots({ expr1: json, expr2: v.parse(Math, expr) }),
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
    isEqual: (expr: Math) => symapi.expr.equal({ expr1: json, expr2: v.parse(Math, expr) }),
    isFactored: () => symapi.expr.isFactored({ expr: json }),
    isSquare: async () => {
      const factored = expr(await expr(json).factor().latex())
      return factored.func === 'Power' && factored.args[1] === 2
    },
    latex: () => symapi.expr.latex({ expr: json }),
    matches: (expr: Math) => symapi.expr.match({ expr1: json, expr2: v.parse(Math, expr) }),
    roots: (complex = false) => symapi.expr.roots({ expr: json, complex }),
    simplify: () => expr(['Simplify', json]),
    subs: (substitutions: Record<string, Math>) => expr(ce.expr(json).subs(substitutions).json),
  }
}

export function expr<T extends Math | undefined>(
  input: T,
): T extends undefined ? undefined : ReturnType<typeof _expr> {
  if (input === undefined) return undefined as any
  return _expr(input) as any
}

function isNegative(expr: Math): boolean {
  if (typeof expr === 'number') return expr < 0
  if (Array.isArray(expr) && expr[0] === 'Negate') return true
  if (Array.isArray(expr) && expr[0] === 'Multiply') return isNegative(expr[1])
  return false
}
