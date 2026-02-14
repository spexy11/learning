export default {
  server: {
    "math/factor": () => import("@/math/Factor/server"),
    "math/simple": () => import("@/math/Simple/server"),
  },
};
