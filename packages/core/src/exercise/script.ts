import { Glob } from 'bun'
import { watch } from 'fs/promises'

async function glob(pattern: string) {
  const glob = new Glob(pattern)
  return await Array.fromAsync(glob.scan('.'))
}

async function generateUI() {
  const files = await glob('**/view.tsx')
  const content = String.raw`
    import { grade, type FeedbackRegistry, feedback } from "./gen.feedback";
    import schema from "./gen.schema";
    import { createExercise, loadView } from "@learning/core";

    const viewRegistry = {
      ${files.map((path) => `"${path.replace('/view.tsx', '')}": loadView(() => import('./${path.replace('.tsx', '')}')),`).join('\n      ')}
    } as const

    const Exercise = createExercise<FeedbackRegistry, typeof viewRegistry>(
      viewRegistry,
      schema,
      grade,
      feedback,
    );
    export default Exercise
  `.replace(/^ {4}/gm, '')
  await Bun.write('./gen.view.ts', content)
}

async function generateSchema() {
  const files = (await glob('**/model.ts')).filter((p) => p.includes('/'))
  const content = String.raw`
    import * as v from "valibot";
    import { Exercise } from "@learning/core";
    ${files.map((path, i) => `import { schema as rawSchema${i} } from "./${path}"`).join('\n')}

    const schema = v.variant("name", [
      ${files.map((path, i) => `Exercise(rawSchema${i}),`).join('\n      ')}
    ])
    export default schema;
  `.replace(/^ {4}/gm, '')
  return await Bun.write('./gen.schema.ts', content)
}

async function generateQueries() {
  const files = (await glob('**/model.ts')).filter((p) => p.includes('/'))
  const content = String.raw`
    import {
      createFeedbackFunction,
      createGenerator,
      createGradeFunction,
      type ModelRegistry as Registry,
    } from "@learning/core";
    import { action, query } from "@solidjs/router";

    ${files.map((path, i) => `import * as feedback${i} from "./${path}"`).join('\n')}

    const feedbackRegistry = [
      ${files.map((path, i) => `feedback${i},`).join('\n      ')}
    ] as const satisfies Registry
    export type FeedbackRegistry = typeof feedbackRegistry;

    export const feedbackFn = createFeedbackFunction(feedbackRegistry);
    export const feedback = query(
      (async (input: any) => {
        "use server";
        return feedbackFn(input);
      }) as unknown as typeof feedbackFn,
      "feedback",
    );

    const gradeFn = createGradeFunction(feedbackRegistry);
    export const grade = action((async (...args: [any, any, any]) => {
      "use server";
      return gradeFn(...args);
    }) as unknown as typeof gradeFn);

    const generatorFn = createGenerator(feedbackRegistry);
    export const generator = (async (input: any) => {
      "use server";
      return generatorFn(input);
    }) as unknown as typeof generatorFn;
  `.replace(/^ {4}/gm, '')
  return await Bun.write('./gen.feedback.ts', content)
}

async function runAll() {
  return await Promise.all([generateUI(), generateSchema(), generateQueries()])
}

const watcher = watch('.')
await runAll()
for await (const event of watcher) {
  console.log(`Detected ${event.eventType} in ${event.filename}`)
  await runAll()
}
