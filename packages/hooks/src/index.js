import HOOKS from './hooks';
import createAddHook from './createAddHook';
import createRemoveHook from './createRemoveHook';
import createHasHook from './createHasHook';
import createRunHook from './createRunHook';
import createCurrentHook from './createCurrentHook';
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
export const removeAllActions = createRemoveHook( HOOKS.actions, true );
export const removeAllFilters = createRemoveHook( HOOKS.filters, true );

// Do action/apply filters functions.
export const doAction     = createRunHook( HOOKS.actions );
export const applyFilters = createRunHook( HOOKS.filters, true );

// Current action/filter functions.
export const currentAction = createCurrentHook( HOOKS.actions );
export const currentFilter = createCurrentHook( HOOKS.filters );

// Doing action/filter: true while a hook is being run.
export const doingAction = createDoingHook( HOOKS.actions );
export const doingFilter = createDoingHook( HOOKS.filters );

// Did action/filter functions.
export const didAction = createDidHook( HOOKS.actions );
export const didFilter = createDidHook( HOOKS.filters );

export const Hooks = () => {
	return {
		addAction,
		addFilter,
		removeAction,
		removeFilter,
		hasAction,
		hasFilter,
		removeAllActions,
		removeAllFilters,
		doAction,
		applyFilters,
		currentAction,
		currentFilter,
		doingAction,
		doingFilter,
		didAction,
		didFilter
	};
};
