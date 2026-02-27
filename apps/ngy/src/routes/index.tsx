import Exercise, { ExerciseEditor } from "@learning/exercises";

export default function Home() {
  return (
    <main>
      <ExerciseEditor />
      <Exercise
        name="math/factor"
        question={{ expr: "x^2 - 1" }}
        attempt={[]}
      />
    </main>
  );
}
