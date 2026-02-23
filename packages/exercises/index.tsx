import { createFeedbackFunction, type Register } from "@learning/core";
import MathFactor from "./math/Factor";
import MathSimple from "./math/Simple";
import { query } from "@solidjs/router";

const register = [MathFactor, MathSimple] as const satisfies Register;

const feedbackFn = createFeedbackFunction(register);
export const feedbackServerFn = query(
  (async (input: any) => {
    "use server";
    return feedbackFn(input);
  }) as unknown as typeof feedbackFn,
  "feedback",
);
