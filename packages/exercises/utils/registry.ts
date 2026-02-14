export const registry = {
  "math/factor": {
    server: () => import("@/math/Factor/server"),
    View: () => import("@/math/Factor/View"),
  },
  "math/simple": {
    server: () => import("@/math/Simple/server"),
    View: () => import("@/math/Simple/View"),
  },
} as const;
