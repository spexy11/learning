import type { Register, RegisterFeedback } from "./exercise";
import { createModel } from "./schema";

export function createFeedbackFunction<const R extends Register>(register: R) {
  const getFeedback: RegisterFeedback<R> = async (
    name,
    question,
    part,
    previous,
  ) => {
    const module = await register[name]?.();
    if (!module) throw new Error(`Module ${String(name)} not found`);
    const feedbackFn = createModel(module.schema).feedback;
    return await feedbackFn(question, part, previous);
  };
  return getFeedback;
}
