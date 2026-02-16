import { CheckMark } from "@learning/components";
import type { View } from "../../utils/types";
import { Show } from "solid-js";

export default {
  start: (props) => (
    <>
      <p>
        Factorisez <strong>complètement</strong> l'expression{" "}
        {props.question.expr}
      </p>
      <p>
        {props.question.expr} ={" "}
        <input name="attempt" value={props.state?.attempt} />
        <CheckMark correct={props.feedback?.correct} />
      </p>
    </>
  ),
} as View<typeof import("./server")>;
