/**
 * WordPress dependencies
 */
import createHooks from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import anchor from './anchor';
import customClassName from './custom-class-name';

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

anchor( hooks );
customClassName( hooks );
