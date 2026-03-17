import { expect, test } from 'bun:test'

import { expr } from './expr'

type Test<T = any> = {
  desc: string
  promise: Promise<T> | T
  result: T
}

function define<T extends Test>(test: T) {
  return test
}

test.each<Test>([
  define({
    desc: 'abs: |i| = 1',
    promise: expr('i').abs().isEqual(1),
    result: true,
  }),
  define({
    desc: 'abs: |1 + i| = sqrt(2)',
    promise: expr('1 + i').abs().isEqual('\\sqrt{2}'),
    result: true,
  }),
  define({
    desc: 'abs: |-5| != -5',
    promise: expr(-5).abs().isEqual(-5),
    result: false,
  }),

  define({
    desc: 'args: xy',
    promise: expr('xy').args,
    result: ['x', 'y'],
  }),

  define({
    desc: 'checkRoot: 2 is a root of x^2 - 5x + 6',
    promise: expr('x^2 - 5x + 6').checkRoot(2),
    result: true,
  }),
  define({
    desc: 'checkRoot: i is a root of x^2 + 1',
    promise: expr('x^2 + 1').checkRoot('i'),
    result: true,
  }),
  define({
    desc: 'checkRoot: 0 is not a root of x^2 + 1',
    promise: expr('x^2 + 1').checkRoot(0),
    result: false,
  }),

  define({
    desc: 'func: xy',
    promise: expr('xy').func,
    result: 'Multiply',
  }),

  define({
    desc: 'isEqual: (x - 2)(x - 3) = x^2 - 5x + 6',
    promise: expr('(x - 2)(x - 3)').isEqual('x^2 - 5x + 6'),
    result: true,
  }),
  define({
    desc: 'isEqual: diff((x - 2)(x - 3)) = 2x - 5',
    promise: expr('(x - 2)(x - 3)').diff().isEqual('2x - 5'),
    result: true,
  }),
  define({
    desc: 'isEqual: sin^2 x + cos^2 x = 1',
    promise: expr('\\sin^2{x} + \\cos^2{x}').isEqual('1'),
    result: true,
  }),
  define({
    desc: 'isEqual: int x dx = x^2 / 2',
    promise: expr('x').integrate().isEqual('\\frac{x^2}{2}'),
    result: true,
  }),
  define({
    desc: 'isEqual: int_0^1 x dx = 1/2',
    promise: expr('x').integrate('x', 0, 1).isEqual('\\frac{1}{2}'),
    result: true,
  }),
  define({
    desc: 'isEqual: i^2 = -1',
    promise: expr('i^2').isEqual(-1),
    result: true,
  }),
  define({
    desc: 'isEqual: 1 + i = sqrt(2) e^{i pi / 4}',
    promise: expr('1 + i').isEqual('\\sqrt{2} e^{i \\frac{\\pi}{4}}'),
    result: true,
  }),
  define({
    desc: 'isEqual: cos x + i sin x = e^{i x}',
    promise: expr('\\cos x + i \\sin x').isEqual('e^{i x}'),
    result: true,
  }),

  define({
    desc: 'json: x^2',
    promise: expr('x^2').json,
    result: ['Power', 'x', 2],
  }),

  define({
    desc: 'latex: diff((x - 2)(x - 3)) = 2x - 5',
    promise: expr('(x-2)(x - 3)').diff().latex(),
    result: '2 x - 5',
  }),
  define({
    desc: "latex: (sin x)' = cos x",
    promise: expr('\\sin{x}').diff().latex(),
    result: String.raw`\cos{\left(x \right)}`,
  }),
  define({
    desc: 'latex: factor(x^2 - 5x + 6) = (x - 2)(x - 3)',
    promise: expr('x^2 - 5x + 6').factor().latex(),
    result: String.raw`\left(x - 3\right) \left(x - 2\right)`,
  }),

  define({
    desc: 'pattern: x^2 - 4 = (a + b) (a - b)',
    promise: expr('x^2 - 4').matches('(a + b) (a - b)'),
    result: true,
  }),
  define({
    desc: 'pattern: x^2 - 4 != (a + b)^2',
    promise: expr('x^2 - 4').matches('(a + b)^2'),
    result: false,
  }),
  define({
    desc: 'pattern: x^2 + 2x + 1 = (a + b)^2',
    promise: expr('x^2 + 2x + 1').matches('(a + b)^2'),
    result: true,
  }),

  define({
    desc: 'roots: x^2 - 1',
    promise: expr('x^2 - 1').roots(),
    result: ['-1', '1'],
  }),
  define({
    desc: 'roots: x^2 + 1 has no real roots',
    promise: expr('x^2 + 1').roots(),
    result: [],
  }),
  define({
    desc: 'roots: x^2 + 1 has two complex roots',
    promise: expr('x^2 + 1').roots(true),
    result: ['i', '- i'],
  }),
  define({
    desc: 'roots: x^3 + 1 has one real root',
    promise: expr('x^3 - 1').roots(),
    result: ['1'],
  }),
  define({
    desc: 'roots: x^3 + 1 has three complex roots',
    promise: expr('x^3 - 1')
      .roots(true)
      .then((r) => r.length),
    result: 3,
  }),

  define({
    desc: 'subs: x^2, x -> y',
    promise: expr('x^2').subs({ x: 'y' }).latex(),
    result: 'y^{2}',
  }),
])('$desc', async ({ promise, result }) => {
  expect(await promise).toEqual(result)
})
