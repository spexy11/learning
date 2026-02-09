import { type Action, Exercise, grade } from "@learning/exercises";
import { action } from "@solidjs/router";

const submit = action(async (exercise, step, form) => {
  "use server";
  return await grade(exercise, step, form);
}) satisfies Action;

export default function Home() {
  return (
    <main class="bg-white text-center mx-auto text-gray-700 p-4">
      <Exercise
        action={submit}
        name="math/factor"
        question={{ expr: "x^2 - 5x + 6" }}
        attempt={[]}
      />
      <button>Submit</button>
    </main>
  );
}
