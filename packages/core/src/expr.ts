import z from 'zod/v4'

import { type MathJsonExpression, ComputeEngine, evaluate } from '@cortex-js/compute-engine'
import symapi from './symapi'
import { exp } from '@cortex-js/compute-engine/interval'
import { value } from 'valibot'

const ce = new ComputeEngine()

const integrateParams = z.union([
  z.tuple([z.string().default('x')]),
  z
    .tuple([z.string(), z.string().or(z.number()), z.string().or(z.number())])
    .transform(([x, a, b]) => [['Tuple', x, a, b]] as const),
])

function getMathJson(input: MathJsonExpression) {
  return typeof input === 'string' ? ce.parse(input).json : input
}

export function expr(input: MathJsonExpression) {
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
    integrate: (...params: z.input<typeof integrateParams>) =>
      expr(['Integrate', json, ...integrateParams.parse(params)]),
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

export function quantity(magnitude: number, unit: string) {
  const json: MathJsonExpression = ['Quantity', magnitude, unit]

  return {
    magnitude,
    unit,
    json,

  isEqual(otherMagnitude: number, otherUnit: string): boolean {
    const expr1 = ce.parse(`${magnitude}\\mathrm{${unit}}`)
    const expr2 = ce.parse(`${otherMagnitude}\\mathrm{${otherUnit}}`)

    const diff = ce.expr(['Subtract', expr1.json, expr2.json]).evaluate()

    // console.log('diff json:', JSON.stringify(diff.json)) test for code review 
    if (Array.isArray(diff.json) && diff.json[0] === 'Quantity') {
      return Math.abs(diff.json[1] as number) < 1e-9
    }

    
    return false
},
  }
}