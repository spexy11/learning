export default {
  server: {
    "math/factor": () => import("../math/Factor"),
    "math/simple": () => import("../math/Simple"),
  },
  views: {
    "math/factor": () => import("../math/Factor/View"),
    "math/simple": () => import("../math/Simple/View"),
  },
};
