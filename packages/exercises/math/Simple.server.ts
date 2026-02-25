import * as v from "valibot";
import { expr, type Feedback, type Schema } from "@learning/core";

export const schema = {
  name: "math/simple",
  question: {
    text: {
      type: "markdown",
      label: "Énoncé",
      description: "Énoncé de l'exercice",
    },
    answer: {
      type: "latex",
      label: "Réponse",
      description: "Réponse de l'exercice",
    },
    label: {
      type: "markdown",
      label: "Libellé de la réponse",
      description: "Texte affiché juste avant le champ de la réponse",
    },
    unit: {
      type: "markdown",
      label: "Unité",
      description: "Texte affiché juste après le champ de la réponse",
    },
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
