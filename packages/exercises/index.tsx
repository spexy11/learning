import {
  createFeedbackFunction,
  createGradeFunction,
  type Register,
} from "@learning/core";
import MathFactor from "./math/Factor";
import MathSimple from "./math/Simple";
import { query } from "@solidjs/router";

const register = [MathFactor, MathSimple] as const satisfies Register;

const feedbackFn = createFeedbackFunction(register);
export const feedback = query(
  (async (input: any) => {
    "use server";
    return feedbackFn(input);
  }) as unknown as typeof feedbackFn,
  "feedback",
);

const gradeFn = createGradeFunction(register);
export const grade = query(
  (async (input: any) => {
    "use server";
    return gradeFn(input);
  }) as unknown as typeof gradeFn,
  "grade",
);
