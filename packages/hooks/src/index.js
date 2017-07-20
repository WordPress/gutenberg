import HOOKS from './hooks';
import createAddHook from './createAddHook';
import createRemoveHook from './createRemoveHook';
import createRunHook from './createRunHook';
import createCurrentHook from './createCurrentHook';
import createDoingHook from './createDoingHook';
import createDidHook from './createDidHook';
import createHasHook from './createHasHook';
import createRemoveAllHook from './createRemoveAllHook';


// Remove functions.
export const removeFilter = createRemoveHook( HOOKS.filters );
export const removeAction = createRemoveHook( HOOKS.actions );

// Do action/apply filter functions.
export const doAction =     createRunHook( HOOKS.actions );
export const applyFilters = createRunHook( HOOKS.filters, true );

// Add functions.
export const addAction = createAddHook( HOOKS.actions );
export const addFilter = createAddHook( HOOKS.filters );

// Doing action/filter: true while a hook is being run.
export const doingAction = createDoingHook( HOOKS.actions );
export const doingFilter = createDoingHook( HOOKS.filters );

// Did functions.
export const didAction = createDidHook( HOOKS.actions );
export const didFilter = createDidHook( HOOKS.filters );

// Has functions.
export const hasAction = createHasHook( HOOKS.actions );
export const hasFilter = createHasHook( HOOKS.filters );

// Remove all functions.
export const removeAllActions = createRemoveAllHook( HOOKS.actions );
export const removeAllFilters = createRemoveAllHook( HOOKS.filters );

// Current filter.
export const currentFilter = createCurrentHook( HOOKS.filters );

