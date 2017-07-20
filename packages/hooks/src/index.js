import HOOKS from './hooks';
import createAddHook from './createAddHook';
import createRemoveHook from './createRemoveHook';
import createRemoveAllHook from './createRemoveAllHook';
import createHasHook from './createHasHook';
import createRunHook from './createRunHook';
import createDoingHook from './createDoingHook';
import createDidHook from './createDidHook';

// Add action/filter functions.
export const addAction = createAddHook( HOOKS.actions );
export const addFilter = createAddHook( HOOKS.filters );

// Remove action/filter functions.
export const removeAction = createRemoveHook( HOOKS.actions );
export const removeFilter = createRemoveHook( HOOKS.filters );

// Has action/filter functions.
export const hasAction = createHasHook( HOOKS.actions );
export const hasFilter = createHasHook( HOOKS.filters );

// Remove all actions/filters functions.
export const removeAllActions = createRemoveAllHook( HOOKS.actions );
export const removeAllFilters = createRemoveAllHook( HOOKS.filters );

// Do action/apply filters functions.
export const doAction     = createRunHook( HOOKS.actions );
export const applyFilters = createRunHook( HOOKS.filters, true );

// Current action/filter functions.
export const currentFilter = () => HOOKS.filters.current || null;

// Doing action/filter: true while a hook is being run.
export const doingAction = createDoingHook( HOOKS.actions );
export const doingFilter = createDoingHook( HOOKS.filters );

// Did action/filter functions.
export const didAction = createDidHook( HOOKS.actions );
export const didFilter = createDidHook( HOOKS.filters );
