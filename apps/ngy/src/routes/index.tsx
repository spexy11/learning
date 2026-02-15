import { getFeedback } from "@learning/exercises";

const t = {
  hello: async () => {
    "use server";
    const test = await getFeedback({
      name: "math/factor",
      question: { expr: "x^2" },
      attempt: [{ step: "start", state: { attempt: "x^3" } }],
    });
    console.log(JSON.stringify(test, null, 2));
  },
};

export default function Home() {
  return (
    <main>
      Hello<button onClick={() => t.hello()}>Test</button>
    </main>
  );
}
