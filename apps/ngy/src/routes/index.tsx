import { getFeedback, gradeExercise } from "@learning/exercises";

const t = {
  hello: async () => {
    "use server";
    const graded = await gradeExercise({
      name: "math/factor",
      question: { expr: "x^2" },
      attempt: [{ step: "start", state: { attempt: "x^2" } }],
    });
    console.log(JSON.stringify(graded, null, 2));
    return await getFeedback({
      name: "math/factor",
      question: { expr: "x^2" },
      attempt: [{ step: "start", state: { attempt: "x^3" } }],
    });
  },
};

export default function Home() {
  return (
    <main>
      Hello<button onClick={() => t.hello()}>Test</button>
    </main>
  );
}
