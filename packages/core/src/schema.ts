import z from "zod/v4";

export type Schema = {
  name: string;
  question: z.ZodRawShape;
  steps: Record<string, z.ZodRawShape> & { start: any };
};

type PartSchema<T extends Schema> = {
  [K in keyof T["steps"]]: z.ZodObject<{
    step: z.ZodLiteral<K & string>;
    state: z.ZodObject<T["steps"][K]>;
  }>;
}[keyof T["steps"]][];

export function defineSchema<const T extends Schema>(schema: T) {
  const part = z.union(
    Object.entries(schema.steps).map(([name, state]) =>
      z.object({
        step: z.literal(name),
        state: z.object(state),
      }),
    ) as PartSchema<T>,
  );
  return z.object({
    name: z.literal(schema.name as T["name"]),
    question: z.object(schema.question as T["question"]),
    attempt: z.tuple([part], part),
  });
}

type ZodSchema = ReturnType<typeof defineSchema>;

type StepNames<T extends ZodSchema> = z.output<T>["attempt"][number]["step"];

type Part<T extends ZodSchema, K extends StepNames<T> = StepNames<T>> = Extract<
  z.output<T>["attempt"][number],
  { step: K }
>;

type Exercise<
  T extends ZodSchema,
  K extends StepNames<T> = StepNames<T>,
> = Omit<z.output<T>, "attempt"> & {
  attempt: [Part<T, K>, ...Part<T>[]];
};

type Feedback<T extends ZodSchema> = {
  [K in StepNames<T>]: (
    exercise: Exercise<T, K>,
  ) => AsyncGenerator<[number, number] | StepNames<T>, any>;
};

export function defineFeedback<T extends ZodSchema, F extends Feedback<T>>(
  schema: T,
  feedback: F,
) {
  async function extract<K extends StepNames<T>>(
    action: "grade",
    exercise: Exercise<T, K>,
  ): Promise<{ score: [number, number]; next: StepNames<T> | null }>;
  async function extract<K extends StepNames<T>>(
    action: "feedback",
    exercise: Exercise<T, K>,
  ): Promise<ReturnType<F[K]> extends AsyncGenerator<any, infer R> ? R : never>;
  async function extract<K extends StepNames<T>>(
    action: "grade" | "feedback",
    exercise: Exercise<T, K>,
  ) {
    exercise = schema.parse(exercise) as Exercise<T, K>;
    const step = exercise.attempt[0].step;
    // @ts-ignore
    const generator = feedback[step](exercise);
    let score: [number, number] = [0, 0];
    let next: StepNames<T> | null = null;
    for await (const chunk of generator) {
      if (Array.isArray(chunk))
        score = [score[0] + chunk[0], score[1] + chunk[1]];
      else next = chunk;
    }
    if (action === "grade") return { score, next };
    return (await generator.next()).value;
  }
  return { ...feedback, extract };
}
