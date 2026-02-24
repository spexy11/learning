import {
  createFeedbackFunction,
  createGetSchemaInfo,
  createGradeFunction,
  type SchemaRegistry as Registry,
} from "@learning/core";
import MathFactor from "./math/factor.server";
import MathSimple from "./math/Simple.server";
import { action, query } from "@solidjs/router";

const schemaRegistry = [MathFactor, MathSimple] as const satisfies Registry;
export type SchemaRegistry = typeof schemaRegistry;

export const feedbackFn = createFeedbackFunction(schemaRegistry);
export const feedback = query(
  (async (input: any) => {
    "use server";
    return feedbackFn(input);
  }) as unknown as typeof feedbackFn,
  "feedback",
);

const gradeFn = createGradeFunction(schemaRegistry);
export const grade = action((async (...args: [any, any, any]) => {
  "use server";
  return gradeFn(...args);
}) as unknown as typeof gradeFn);

const getSchemaInfoFn = createGetSchemaInfo(schemaRegistry);
export const getSchemaInfo = query(
  (async () => {
    "use server";
    try {
      return getSchemaInfoFn();
    } catch (error) {
      console.error(error);
    }
  }) as unknown as typeof getSchemaInfoFn,
  "getSchemaInfo",
);
