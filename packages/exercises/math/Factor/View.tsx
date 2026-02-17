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
      <Show when={props.feedback?.correct === false}>
        <p>La tentative n'est pas correcte car</p>
        <ul>
          <Show when={props.feedback?.isFactored}>
            <li>elle n'est pas complètement factorisée</li>
          </Show>
          <Show when={props.feedback?.isFactored}>
            <li>
              les expressions ne sont pas égales, puisque {props.state?.attempt}{" "}
              = {props.feedback?.expanded}.
            </li>
          </Show>
        </ul>
      </Show>
    </>
  ),
  binomial: (props) => (
    <>
      <p>
        L'expression {props.question.expr} peut s'écrire comme une identité
        remarquable. Laquelle?
      </p>
    </>
  ),
  root: (props) => (
    <>
      <p>Trouvez une racine</p>
    </>
  ),
} satisfies View<typeof import("./server")>;
