import { mapAsync, mapValues, sample, sampleSize } from "es-toolkit";
import {
  Exercise,
  FeedbackInput,
  type Feedback,
  type FeedbackReturn,
  type Schema,
} from "./schemas";
import * as v from "valibot";
import { get } from "es-toolkit/compat";

type Question<T extends Schema> = v.InferOutput<
  v.ObjectSchema<T["question"], undefined>
>;

type Module<T extends Schema, F extends Feedback<T>> = {
  schema: T;
  transform?: (question: Question<T>) => Promise<Question<T>>;
  feedback: F;
};

export type SchemaRegistry = Module<any, any>[];

async function gradeExercise<T extends Schema, F extends Feedback<T>>(
  { feedback }: { schema: T; feedback: F },
  { name, question, attempt }: Exercise<T>,
) {
  const graded = await mapAsync(attempt, async (part, i) => {
    const gen = feedback[part.step]({
      name,
      question,
      attempt: attempt.slice(0, i),
      ...part,
    });
    let score: [number, number] = [0, 0];
    let next: keyof T["steps"] | null = null;
    for await (const chunk of gen) {
      if (Array.isArray(chunk))
        score = [score[0] + chunk[0], score[1] + chunk[1]];
      else next = chunk;
    }
    return { ...part, next, score };
  });
  return { name, question, attempt: graded };
}

function BaseExercise<const R extends SchemaRegistry>(
  registry: R,
): v.VariantSchema<
  "name",
  ReturnType<typeof Exercise<R[number]["schema"]>>[],
  undefined
> {
  return v.variant(
    "name",
    registry.map((m) => Exercise(m.schema)),
  ) as any;
}
export type BaseExercise<R extends SchemaRegistry> = v.InferOutput<
  ReturnType<typeof GradedExercise<R>>
>;

export function GradedExercise<const R extends SchemaRegistry>(registry: R) {
  return v.pipeAsync(
    BaseExercise(registry),
    v.transformAsync(async (exercise) => {
      const m = registry.find((m) => m.schema.name === exercise.name)!;
      return gradeExercise(m, exercise);
    }),
  );
}
export type GradedExercise<R extends SchemaRegistry> = v.InferOutput<
  ReturnType<typeof GradedExercise<R>>
>;

export function createGradeFunction<const R extends SchemaRegistry>(
  registry: R,
) {
  return async (exercise: BaseExercise<R>, step: string, form: FormData) => {
    const lastPart = {
      step,
      state: Object.fromEntries(form.entries()),
    };
    return v.parseAsync(GradedExercise(registry), {
      ...exercise,
      attempt: [...exercise.attempt, lastPart],
    });
  };
}

export type ServerModule<
  R extends SchemaRegistry,
  N extends R[number]["schema"]["name"],
> = Extract<R[number], { schema: { name: N } }>;

export function createFeedbackFunction<const R extends SchemaRegistry>(
  registry: R,
) {
  return async function <
    const N extends R[number]["schema"]["name"],
    const K extends keyof ServerModule<R, N>["schema"]["steps"] & string,
  >(
    input: FeedbackInput<ServerModule<R, N>["schema"], K> & {
      name: N;
      step: K;
    },
  ): Promise<
    FeedbackReturn<
      ServerModule<R, N>["schema"],
      ServerModule<R, N>["feedback"],
      K
    >
  > {
    const m = registry.find((m) => m.schema.name === input.name);
    if (!m) throw new Error(`Module ${input.name} is not in the registry`);
    const gen = m.feedback[input.step](input);
    while (true) {
      const { done, value } = await gen.next();
      if (done) return value;
    }
  };
}

function GeneratedExercise<const R extends SchemaRegistry>(registry: R) {
  return v.intersect([
    BaseExercise(registry),
    v.object({
      params: v.optional(
        v.record(
          v.string(),
          v.union([
            v.number(),
            v.string(),
            v.pipe(
              v.tuple([
                v.literal("sample"),
                v.array(v.union([v.number(), v.string()])),
                v.number(),
              ]),
              v.transform(([_, choices, size]) => sampleSize(choices, size)),
            ),
            v.pipe(
              v.array(v.union([v.number(), v.string()])),
              v.transform((choices) => String(sample(choices))),
            ),
          ]),
        ),
      ),
    }),
  ]);
}
type GeneratedExercise<R extends SchemaRegistry> = v.InferInput<
  ReturnType<typeof GeneratedExercise<R>>
>;

export function createGenerator<const R extends SchemaRegistry>(registry: R) {
  return async function (rawExerciseStub: GeneratedExercise<R>) {
    let { params, question, ...exercise } = v.parse(
      GeneratedExercise(registry),
      rawExerciseStub,
    );
    function subs<T>(val: T): T {
      if (!params) return val;
      if (typeof val === "string") {
        try {
          Object.entries(params).forEach(([name, param]) => {
            val = (val as string).replace(/`([a-z0-9\.]+)`/g, (_, path) =>
              String(get(params, path)),
            ) as T;
          });
        } catch (error) {
          console.log(error);
        }
      } else if (typeof val === "object" && val) {
        return mapValues(val, subs) as T;
      } else if (Array.isArray(val)) {
        return val.map(subs) as T;
      }
      return val;
    }
    question = subs(question);
    const m = registry.find((m) => m.schema.name === exercise.name)!;
    if (m.transform) {
      question = (await m.transform(question)) as any;
    }
    return { question, ...exercise };
  };
}
