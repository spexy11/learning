import { mapAsync } from "es-toolkit";
import z from "zod/v4";

function partSchema<const S extends Record<string, z.ZodRawShape>>(steps: S) {
  return z.union(
    Object.entries(steps).map(([name, state]) =>
      z.object({
        step: z.literal(name),
        state: z.object(state),
      }),
    ) as {
      [K in keyof S]: z.ZodObject<
        {
          step: z.ZodLiteral<K & string>;
          state: z.ZodObject<S[K], z.core.$strip>;
        },
        z.core.$strip
      >;
    }[keyof S][],
  );
}

type PartSchema<S extends Record<string, z.ZodRawShape>> = ReturnType<
  typeof partSchema<S>
>;
type Part<
  S extends Record<string, z.ZodRawShape>,
  K extends keyof S = keyof S,
> = Extract<z.infer<PartSchema<S>>, { step: K }>;

type Feedback<
  Q extends z.ZodRawShape,
  S extends Record<string, z.ZodRawShape>,
  R extends Record<keyof S, any>,
> = {
  [K in keyof S]: (
    question: z.infer<z.ZodObject<Q, z.core.$strip>>,
    state: Part<S, K>["state"],
    attempt: Part<S>[],
  ) => AsyncGenerator<[number, number] | keyof S, R[K]>;
};

type FeedbackPayload<F extends Feedback<any, any, any>, K extends keyof F> =
  ReturnType<F[K]> extends AsyncGenerator<any, infer P> ? P : never;

type Schema<
  N extends string,
  Q extends z.ZodRawShape,
  S extends Record<string, z.ZodRawShape>,
  F extends Feedback<Q, S, any>,
> = {
  name: N;
  question: Q;
  steps: S;
  feedback: F;
};

export function defineSchema<
  const N extends string,
  const Q extends z.ZodRawShape,
  const S extends Record<string, z.ZodRawShape>,
  const F extends Feedback<Q, S, any>,
>(schema: Schema<N, Q, S, F>) {
  return schema;
}

export function createModel<
  const N extends string,
  const Q extends z.ZodRawShape,
  const S extends Record<string, z.ZodRawShape>,
  const F extends Feedback<Q, S, any>,
>(schema: Schema<N, Q, S, F>) {
  const name = z.literal(schema.name);
  const question = z.object(schema.question);
  const attempt = partSchema(schema.steps).array().default([]);
  const generated = z
    .custom<
      () => Promise<z.input<typeof question>>
    >((fn) => typeof fn === "function" && fn.length === 0)
    .transform(async (fn) => await question.parseAsync(await fn()));
  return {
    async feedback<K extends keyof S>(
      q: z.output<typeof question>,
      part: Part<S, K>,
      previous: Part<S>[],
    ): Promise<FeedbackPayload<F, K>> {
      const feedback = schema.feedback[part.step](q, part.state, previous);
      let chunk;
      do {
        chunk = await feedback.next();
      } while (!chunk.done);
      return chunk.value;
    },
    schema: z
      .object({ name, question: question.or(generated), attempt })
      .transform(async (data) => {
        const attempt = await mapAsync(data.attempt, async (part, i) => {
          const feedback = schema.feedback[part.step](
            data.question,
            part.state,
            data.attempt.slice(0, i),
          );
          let next: keyof S | null = null;
          let score: [number, number] = [0, 0];
          for await (const chunk of feedback) {
            if (Array.isArray(chunk))
              score = [score[0] + chunk[0], score[1] + chunk[1]];
            else next = chunk;
          }
          return { ...part, score, next };
        });
        return { ...data, attempt };
      }),
  };
}

export type Props<S extends Schema<any, any, any, any>> = {
  [K in keyof S["steps"]]: {
    question: z.output<z.ZodObject<S["question"], z.core.$strip>>;
    part: Part<S["steps"], K>;
    attempt: Part<S["steps"]>[];
    feedback: () => Promise<FeedbackPayload<S["feedback"], K>>;
  };
};
