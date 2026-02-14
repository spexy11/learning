import { CheckMark } from "@learning/components";
import type { View } from "@/utils/types";

export default {
  start: (props) => (
    <>
      <p>{props.question.text}</p>
      <p>
        {props.question.label} = <input value={props.state?.attempt} />
        {props.question.unit}
        <CheckMark correct={props.feedback?.equal} />
        {props.feedback}
      </p>
    </>
  ),
} as View<typeof import("./server")>;
