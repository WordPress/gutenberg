import HOOKS from './hooks';
import createAddHook from './createAddHook';
import createRemoveHook from './createRemoveHook';
import createHasHook from './createHasHook';
import createRunHook from './createRunHook';
import createCurrentHook from './createCurrentHook';
import createDoingHook from './createDoingHook';
import createDidHook from './createDidHook';

// Add action/filter functions.
export var addAction = createAddHook(HOOKS.actions);
export var addFilter = createAddHook(HOOKS.filters);

// Remove action/filter functions.
export var removeAction = createRemoveHook(HOOKS.actions);
export var removeFilter = createRemoveHook(HOOKS.filters);

// Has action/filter functions.
export var hasAction = createHasHook(HOOKS.actions);
export var hasFilter = createHasHook(HOOKS.filters);

// Remove all actions/filters functions.
export var removeAllActions = createRemoveHook(HOOKS.actions, true);
export var removeAllFilters = createRemoveHook(HOOKS.filters, true);

// Do action/apply filters functions.
export var doAction = createRunHook(HOOKS.actions);
export var applyFilters = createRunHook(HOOKS.filters, true);

// Current action/filter functions.
export var currentAction = createCurrentHook(HOOKS.actions);
export var currentFilter = createCurrentHook(HOOKS.filters);

// Doing action/filter: true while a hook is being run.
export var doingAction = createDoingHook(HOOKS.actions);
export var doingFilter = createDoingHook(HOOKS.filters);

// Did action/filter functions.
export var didAction = createDidHook(HOOKS.actions);
export var didFilter = createDidHook(HOOKS.filters);