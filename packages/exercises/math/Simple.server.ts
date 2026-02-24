import * as v from "valibot";
import { expr, type Feedback, type Schema } from "@learning/core";

export const schema = {
  name: "math/simple",
  question: {
    text: v.pipe(
      v.string(),
      v.title("Énoncé"),
      v.description("Énoncé de l'exercice, entré en markdown"),
      v.metadata({ type: "markdown" }),
    ),
    answer: v.pipe(
      v.string(),
      v.title("Réponse"),
      v.description("Réponse de l'exercice, entrée en LaTeX"),
      v.metadata({ type: "latex" }),
    ),
    label: v.pipe(
      v.string(),
      v.title("Libellé de la réponse"),
      v.description(
        "Texte affiché juste avant le champ de la réponse, entré en Markdown",
      ),
      v.metadata({ type: "markdown" }),
    ),
    unit: v.pipe(
      v.string(),
      v.title("Unité"),
      v.description(
        "Texte affiché juste après le champ de la réponse, entré en Markdown.",
      ),
      v.metadata({ type: "markdown" }),
    ),
  },
  steps: {
    start: { attempt: v.string() },
  },
} as const satisfies Schema;

export const feedback = {
  start: async function* ({ question, state }) {
    const equal = await expr(state.attempt).isEqual(question.answer);
    yield [Number(equal), 1];
    return { equal };
  },
} satisfies Feedback<typeof schema>;

export default { schema, feedback };
