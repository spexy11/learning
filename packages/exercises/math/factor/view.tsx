import { CheckMark, Field, MathField } from '@learning/components'
import type { View } from '@learning/core'

export default {
  start: (props) => (
    <>
      <p>
        Factorise <strong>complètement</strong> l'expression {props.field.question.expr}
      </p>
      <div class="flex items-center justify-center">
        {props.field.question.expr}
        <MathField value="=" readOnly />
        {props.field.state.attempt}
        <CheckMark correct={() => props.feedback()?.correct} />
      </div>
    </>
  ),
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
