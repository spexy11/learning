import { Button, CheckMark, MathField } from "@learning/components";
import type { View } from "../../utils/types";
import { Show } from "solid-js";

export default {
  start: (props) => (
    <div class="prose">
      <p>
        Factorisez <strong>complètement</strong> l'expression{" "}
        <MathField value={props.question.expr} readOnly />:
      </p>
      <div class="flex items-center justify-center">
        <MathField value={props.question.expr + `=`} readOnly />
        <MathField name="attempt" value={props.state?.attempt} />
        <CheckMark correct={props.feedback?.correct} />
      </div>
      <Show when={props.feedback?.correct === false}>
        <div class="border-red-400 mx-auto my-4 bg-red-100 p-4 rounded-xl">
          <p>La tentative n'est pas correcte car</p>
          <ul>
            <Show when={props.feedback?.isFactored === false}>
              <li>elle n'est pas complètement factorisée</li>
            </Show>
            <Show when={props.feedback?.isFactored}>
              <li>
                les expressions ne sont pas égales, puisque{" "}
                <MathField
                  value={`${props.state?.attempt} = ${props.feedback?.expanded}`}
                  readOnly
                />
              </li>
            </Show>
          </ul>
        </div>
      </Show>
    </div>
  ),
  binomial: (props) => (
    <>
      <p>
        L'expression <MathField value={props.question.expr} readOnly /> peut
        s'écrire comme une identité remarquable. Laquelle?
      </p>
      <div class="flex gap-4 justify-center">
        <Button>
          <MathField value="(a + b)^2" readOnly />
        </Button>
        <Button>
          <MathField value="(a - b)^2" readOnly />
        </Button>
        <Button>
          <MathField value="(a + b) (a - b)" readOnly />
        </Button>
      </div>
    </>
  ),
  root: (props) => (
    <>
      <p>Trouvez une racine</p>
    </>
  ),
} satisfies View<typeof import("./server")>;
