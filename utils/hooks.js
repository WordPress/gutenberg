/**
 * WordPress dependencies
 */
import createHooks from '@wordpress/hooks';

const hooks = createHooks();

const {
	addAction,
	addFilter,
	removeAction,
	removeFilter,
	removeAllActions,
	removeAllFilters,
	doAction,
	applyFilters,
	doingAction,
	doingFilter,
	didAction,
	didFilter,
	hasAction,
	hasFilter,
} = hooks;

export {
	addAction,
	addFilter,
	removeAction,
	removeFilter,
	removeAllActions,
	removeAllFilters,
	doAction,
	applyFilters,
	doingAction,
	doingFilter,
	didAction,
	didFilter,
	hasAction,
	hasFilter,
};
