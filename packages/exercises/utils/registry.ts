import type z from "zod/v4";

const registry = {
  "math/factor": () => import("../math/factor"),
};

export type Module<N extends keyof typeof registry> = Awaited<
  ReturnType<(typeof registry)[N]>
>;
export type Exercise<N extends keyof typeof registry> = z.input<
  Module<N>["schema"]
>;

export default registry;
