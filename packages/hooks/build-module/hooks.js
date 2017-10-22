/**
 * Contains the registered hooks, keyed by hook type. Each hook type is an
 * array of objects with priority and callback of each registered hook.
 */
var HOOKS = {
  actions: {},
  filters: {}
};

export default HOOKS;