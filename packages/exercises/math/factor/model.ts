import {
  expr,
  field,
  type Feedback,
  type Schema,
  type Transform,
} from "@learning/core";

export const schema = {
  name: "math/factor",
  question: {
    expr: field("math").meta({
      label: "Expression",
      description: "L'expression à factoriser",
    }),
  },
  steps: {
    start: {
      attempt: field("math").meta({
        label: "Réponse",
        description: "Entrez votre réponse ici",
      }),
    },
    binomial: {
      type: field("select").options({
        square: "(a \\pm b)^2",
        conjugate: "(a + b)(a - b)",
      }),
    },
    root: { root: field("math") },
  },
} as const satisfies Schema;

export const transform: Transform<typeof schema> = async (question) => {
  return { expr: await expr(question.expr).expand().latex() };
};

export const feedback = {
  start: async function* ({ question, state }) {
    const isEqual = await expr(state.attempt).isEqual(question.expr);
    const isFactored = await expr(state.attempt).isFactored();
    const correct = isEqual && isFactored;
    yield [Number(correct), 1];

    const squaredSum = await expr(question.expr).matches("(a + b)^2");
    const conj = await expr(question.expr).matches("(a + b)(a - b)");
    if (correct) yield null;
    else if (squaredSum || conj) yield "binomial";
    else yield "root";

    return {
      expanded: await expr(state.attempt).expand().latex(),
      correct,
      isEqual,
      isFactored,
    };
  },
  binomial: async function* ({ question, state }) {
    yield [0, 0];
    const conjugate = await expr(question.expr).matches("(a + b)(a - b)");
    const correct = (state.type === "conjugate") === conjugate;
    yield correct ? "start" : null;
    return { correct };
  },
  root: async function* () {
    yield [0, 0];
  },
} satisfies Feedback<typeof schema>;
