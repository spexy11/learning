import { CheckMark, MathField, Spinner } from '@learning/components'
import { expr, type View } from '@learning/core'
import { createAsync } from '@solidjs/router'

export default {
  start: (props) => {
    const attempt = () => expr(props.state?.attempt)
    const question = () => expr(props.question.expr)
    const equal = createAsync(async () => attempt() && question().isEqual(attempt()!.json))
    const factored = createAsync(async () => attempt()?.isFactored())
    const correct = () => equal() && factored()

    const answer = createAsync(() => question().factor().latex())
    return (
      <>
        <p>
          Factorise <strong>complètement</strong> l'expression {props.field.question.expr}
        </p>
        <div class="flex items-center justify-center">
          {props.field.question.expr}
          <MathField value="=" readOnly />
          {props.field.state.attempt}
          <CheckMark correct={correct} />
        </div>
        <Spinner>La réponse est {answer()}</Spinner>
      </>
    )
  },
  binomial: (props) => (
    <>
      <p>
        L'expression {props.field.question.expr} est un <strong>produit remarquable</strong>. Quelle
        expression lui correspond le plus ?
      </p>
      {props.field.state.type}
      <CheckMark correct={() => props.feedback()?.correct} />
    </>
  ),
  root: (props) => (
    <>
      <p>Trouvez une racine de {props.field.question.expr} :</p>
      <div class="flex items-center justify-center">
        <MathField value="=" readOnly />
        {props.field.state.root}
        <CheckMark correct={() => props.feedback()?.correct} />
      </div>
    </>
  ),
} as View<typeof import('./model')>
