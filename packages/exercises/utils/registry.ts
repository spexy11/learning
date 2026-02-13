import type z from "zod/v4";

export const registry = {
  "math/factor": () => import("../math/factor"),
};

export const cache: Partial<{ [K in keyof typeof registry]: Module<K> }> = {};

export async function loadModule(name: keyof typeof registry) {
  if (!cache[name]) cache[name] = await registry[name]();
  return cache[name];
}

export type Module<N extends keyof typeof registry> = Awaited<
  ReturnType<(typeof registry)[N]>
>;
export type Exercise<N extends keyof typeof registry> = z.input<
  Module<N>["schema"]
>;
