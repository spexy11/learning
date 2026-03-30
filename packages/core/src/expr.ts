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
    args: () => {
      if (!Array.isArray(json)) throw new Error(`Only arrays have the property args`)
      return json.slice(1) as Math[]
    },
    checkRoot: (root: Expression, x = 'x') =>
      expr(json)
        .subs({ [x]: v.parse(Expression, root) })
        .isEqual(0),
    diff: (x = 'x') => expr(['Derivative', json, x]),
    expand: () => expr(['Expand', json]),
    factor: () => expr(['Factor', json]),
    func: () => {
      if (!Array.isArray(json)) throw new Error(`Only arrays have the property func`)
      return json[0] as string
    },
    integrate: (...params: v.InferInput<typeof integrateParams>) =>
      expr(['Integrate', json, ...v.parse(integrateParams, params)]),
    isEqual: (other: Expression) =>
      symapi.expr.equal({ expr1: json, expr2: v.parse(Expression, other) }),
    isFactored: () => symapi.expr.isFactored({ expr: json }),
    latex: () => symapi.expr.latex({ expr: json }),
    matches: (other: Expression) =>
      symapi.expr.match({ expr1: json, expr2: v.parse(Expression, other) }),
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



export function quantity(magnitude: Math, unit: Math,error?:Math) {
  const json: MathJsonExpression = ['Quantity', magnitude, unit]

  return {
    magnitude,
    unit,
    json,
    error,

    async isEqual(otherMagnitude: Math, otherUnit: Math, error: Math = '1'): Promise<boolean >{

      const expr1 = ce.parse(`${magnitude}\\mathrm{${unit}}`)
      const expr2 = ce.parse(`${otherMagnitude}\\mathrm{${otherUnit}}`)
      const diff = ce.expr(['Subtract', expr1.json, expr2.json]).evaluate()
      console.log(diff.json)
      if (!error && Array.isArray(diff.json)) {
        if (Array.isArray(diff.json)) {
          return symapi.expr.equal({ expr1: diff.json[1], expr2: 0 })
        }
      }
      if (Array.isArray(diff.json) && diff.json[0] === 'Quantity') {
          const errorEvaluated = ce.parse(error as string).evaluate()
          const errorConverted =  ce.expr(['UnitConvert', errorEvaluated, diff.json[2]]).evaluate()
          if (Array.isArray(errorConverted.json) && errorConverted.json[0] === 'Quantity')
          return ((diff.json[1] as number) < (errorConverted.json[1] as number) && (diff.json[1] as number) < (errorConverted.json[1] as number))
      }

      return false
    },
  }
}