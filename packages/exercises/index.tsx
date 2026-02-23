import { createExercise, loadView, type ViewRegistry } from "@learning/core";
import { grade, type SchemaRegistry, feedback } from "./index.server";

const viewRegistry = {
  "math/factor": loadView(() => import("./math/factor.view")),
} as const satisfies ViewRegistry;

const Exercise = createExercise<SchemaRegistry, typeof viewRegistry>(
  viewRegistry,
  grade,
  feedback,
);

export default Exercise;
