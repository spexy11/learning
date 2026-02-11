import { Exercise } from "@learning/exercises";

export default function Home() {
  return (
    <main class="container bg-white mx-auto text-gray-700 p-4">
      <Exercise
        name="math/factor"
        question={{ expr: "x^2 - 5x + 6" }}
        attempt={[]}
      />
    </main>
  );
}
