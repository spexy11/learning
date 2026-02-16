export default {
  server: {
    "math/factor": () => import("../math/Factor/server"),
    "math/simple": () => import("../math/Simple/server"),
  },
  views: {
    "math/factor": () => import("../math/Factor/View"),
    "math/simple": () => import("../math/Simple/View"),
  },
};
