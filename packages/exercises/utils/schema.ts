import { type Schema } from "./types";
import z from "zod/v4";
import registry from "./registry";
import { memoize } from "es-toolkit";

export function buildSchema<const T extends Schema>(schema: T) {
  const part = z.union(
    Object.entries(schema.steps).map(([step, state]) =>
      z.object({
        step: z.literal(step),
        state: z.object(state),
      }),
    ) as {
      [K in keyof T["steps"]]: z.ZodObject<{
        step: z.ZodLiteral<K & string>;
        state: z.ZodObject<T["steps"][K]>;
      }>;
    }[keyof T["steps"]][],
  );
  return z.object({
    name: z.literal(schema.name as T["name"]),
    question: z.object(schema.question as T["question"]),
    attempt: z.tuple([part], part),
  });
}

export const getSchema = memoize(
  async <N extends keyof (typeof registry)["server"]>(
    name: N,
  ): Promise<
    (typeof registry)["server"][N] extends () => Promise<{
      schema: infer T extends Schema;
    }>
      ? ReturnType<typeof buildSchema<T>>
      : never
  > => {
    const module = await registry.server[name]();
    return buildSchema(module.schema) as any;
  },
);
