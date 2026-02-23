import { MathField } from "@learning/components";
import type { View } from "@learning/core";

export default {
  start: (props) => (
    <>
      <p>Factorisez l'expression suivante:</p>
      <MathField value={props.question.expr} />
    </>
  ),
  binomial: (props) => (
    <>
      <p>Hello world</p>
    </>
  ),
  root: (props) => (
    <>
      <p>Hello world</p>
    </>
  ),
} satisfies View<typeof import("./factor.server")>;
