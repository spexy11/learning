import {
  createFeedbackFunction,
  createGradeFunction,
  type SchemaRegistry,
} from "@learning/core";
import MathFactor from "./math/factor.server";
import MathSimple from "./math/Simple.server";
import { action, query } from "@solidjs/router";

const schemaRegistry = [
  MathFactor,
  MathSimple,
] as const satisfies SchemaRegistry;

const viewRegistry = {
  "math/factor": () => import("./math/factor.view"),
};

const feedbackFn = createFeedbackFunction(schemaRegistry);
export const feedback = query(
  (async (input: any) => {
    "use server";
    return feedbackFn(input);
  }) as unknown as typeof feedbackFn,
  "feedback",
);

const gradeFn = createGradeFunction(schemaRegistry);
export const grade = action((async (input: any) => {
  "use server";
  return gradeFn(input);
}) as unknown as typeof gradeFn);
