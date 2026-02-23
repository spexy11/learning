import { MathField } from "@learning/components";
import type { View } from "@learning/core";

export default {
  start: (props) => (
    <>
      <p>Factorisez l'expression suivante:</p>
      <MathField value={`${props.question.expr}=`} readOnly />
      <MathField name="attempt" value={props.state?.attempt ?? ""} />
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
} as View<typeof import("./factor.server")>;
