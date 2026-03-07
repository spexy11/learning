import { clientOnly } from '@solidjs/start'

const Dot = clientOnly(() => import('./Dot'))

type Expr = string | number | Expr[]

function mathjsonToDot(expr: Expr) {
  let nodeId = 0
  const nodes: string[] = []
  const edges: string[] = []
  function walk(node: Expr, parentId: string | null = null) {
    const currentId = `n${nodeId++}`
    if (Array.isArray(node)) {
      const operator = node[0]
      nodes.push(`${currentId} [label="${operator}"]`)
      if (parentId !== null) {
        edges.push(`${parentId} -> ${currentId}`)
      }
      for (let i = 1; i < node.length; i++) {
        walk(node[i]!, currentId)
      }
    } else {
      nodes.push(`${currentId} [label="${node}"]`)
      if (parentId !== null) {
        edges.push(`${parentId} -> ${currentId}`)
      }
    }
    return currentId
  }
  walk(expr)
  return `
    digraph MathAST {
      node [shape=box];
      ${nodes.join('\n')}
      ${edges.join('\n')}
    }`
}

type Props = {
  class?: string
  value: string
}

export default function MathJson(props: Props) {
  return <Dot class={props.class} value={mathjsonToDot(props.value)} />
}
