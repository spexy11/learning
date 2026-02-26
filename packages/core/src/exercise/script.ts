import { Glob } from "bun";
import { watch } from "fs/promises";

async function glob(pattern: string) {
  const glob = new Glob(pattern);
  return await Array.fromAsync(glob.scan("."));
}

async function generateUI() {
  const files = await glob("**/*.view.tsx");
  const content = String.raw`
    import { grade, type SchemaRegistry, feedback } from "./index.server";
    import { createExercise, loadView } from "@learning/core";

    const viewRegistry = {
      ${files.map((path) => `"${path.replace(".view.tsx", "")}": loadView(() => import('./${path.replace(".tsx", "")}')),`).join("\n      ")}
    } as const

    const Exercise = createExercise<SchemaRegistry, typeof viewRegistry>(
      viewRegistry,
      grade,
      feedback,
    );
    export default Exercise
  `.replace(/^ {4}/gm, "");
  await Bun.write("./gen.view.ts", content);
}

async function generateSchema() {
  const files = (await glob("**/*.server.ts")).filter((p) => p.includes("/"));
  const content = String.raw`
    import * as v from "valibot";
    import { Exercise } from "@learning/core";
    ${files.map((path, i) => `import { schema as rawSchema${i} } from "./${path}"`).join("\n")}

    const schema = v.variant("name", [
      ${files.map((path, i) => `Exercise(rawSchema${i}),`).join("\n      ")}
    ])
    export default schema;
  `.replace(/^ {4}/gm, "");
  await Bun.write("./gen.schema.ts", content);
}

const watcher = watch(".");
generateUI();
generateSchema();
for await (const event of watcher) {
  console.log(`Detected ${event.eventType} in ${event.filename}`);
  generateUI();
  generateSchema();
}
