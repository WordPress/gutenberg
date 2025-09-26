/**
 * Internal dependencies
 */
import createHooks from './createHooks';

export * from './types';

export const defaultHooks = createHooks();

const {
	addAction,
	addFilter,
	removeAction,
	removeFilter,
	hasAction,
	hasFilter,
	removeAllActions,
	removeAllFilters,
	doAction,
	doActionAsync,
	applyFilters,
	applyFiltersAsync,
	currentAction,
	currentFilter,
	doingAction,
	doingFilter,
	didAction,
	didFilter,
	actions,
	filters,
} = defaultHooks;

export {
	createHooks,
	addAction,
	addFilter,
	removeAction,
	removeFilter,
	hasAction,
	hasFilter,
	removeAllActions,
	removeAllFilters,
	doAction,
	doActionAsync,
	applyFilters,
	applyFiltersAsync,
	currentAction,
	currentFilter,
	doingAction,
	doingFilter,
	didAction,
	didFilter,
	actions,
	filters,
};
