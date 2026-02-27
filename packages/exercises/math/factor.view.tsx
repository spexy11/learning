import { CheckMark, Field, MathField } from "@learning/components";
import type { View } from "@learning/core";

export default {
  start: (props) => (
    <>
      <p>
        Factorise <strong>complètement</strong> l'expression{" "}
        {props.field.question.expr}
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
        L'expression {props.field.question.expr} est un{" "}
        <strong>produit remarquable</strong>.
      </p>
      <div class="flex items-center justify-center gap-8">
        <label>
          <input
            type="radio"
            name="type"
            value="square"
            checked={props.state?.type === "square"}
          />
          <MathField value={`(a \\pm b)^2`} readOnly />
        </label>
        <label>
          <input
            type="radio"
            name="type"
            value="conjugate"
            checked={props.state?.type === "conjugate"}
          />
          <MathField value={`(a + b)(a - b)`} readOnly />
        </label>
        <CheckMark correct={() => props.feedback()?.correct} />
      </div>
    </>
  ),
  root: (props) => (
    <>
      <p>Trouvez une racine de {props.field.question.expr} :</p>
      <MathField value={props.state?.root} />
    </>
  ),
} as View<typeof import("./factor.server")>;
