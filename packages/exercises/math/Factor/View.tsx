import type { View } from "../../utils/types";

export default {
  start: (props) => (
    <>
      <p>
        Factorisez <strong>complètement</strong> l'expression{" "}
        {props.question.expr}
      </p>
      <p>
        {props.question.expr} = <input value={props.state?.attempt} />
      </p>
      {props.feedback}
    </>
  ),
} satisfies View<typeof import("./server")>;
