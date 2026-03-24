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

export const Expression = v.union([
  Math,
  v.pipe(
    v.looseObject({ json: Math }),
    v.transform((v) => v.json),
  ),
])
export type Expression = v.InferInput<typeof Expression>

function _expr(input: Math) {
  const json = v.parse(Math, input)
  return {
    rawInput: String(input),
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
    diff: (x = 'x') => expr(['Derivative', json, x]),
    expand: () => expr(['Expand', json]),
    factor: () => expr(['Factor', json]),
    get func() {
      if (!Array.isArray(json)) throw new Error(`Only arrays have the property func`)
      return json[0] as string
    },
    integrate: (...params: v.InferInput<typeof integrateParams>) =>
      expr(['Integrate', json, ...v.parse(integrateParams, params)]),
    isEqual: (expr: Expression) =>
      symapi.expr.equal({ expr1: json, expr2: v.parse(Expression, expr) }),
    isFactored: () => symapi.expr.isFactored({ expr: json }),
    latex: () => symapi.expr.latex({ expr: json }),
    matches: (expr: Expression) =>
      symapi.expr.match({ expr1: json, expr2: v.parse(Expression, expr) }),
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
