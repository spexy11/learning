import Exercise from "@learning/exercises";

export default function Home() {
  return (
    <main>
      <Exercise
        name="math/factor"
        question={{ expr: "x^2 - 2x + 1" }}
        attempt={[]}
      />
    </main>
  );
}
