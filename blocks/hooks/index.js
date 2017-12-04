/**
 * WordPress dependencies
 */
import { createHooks } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import anchor from './anchor';
import customClassName from './custom-class-name';
import generatedClassName from './generated-class-name';
import customClassDropdown from './custom-class-dropdown';
import matchers from './matchers';

const hooks = createHooks();

const {
	addFilter,
	removeFilter,
	removeAllFilters,
	applyFilters,
	doingFilter,
	didFilter,
	hasFilter,
} = hooks;

export {
	addFilter,
	removeFilter,
	removeAllFilters,
	applyFilters,
	doingFilter,
	didFilter,
	hasFilter,
};

anchor( hooks );
customClassName( hooks );
customClassDropdown( hooks );
generatedClassName( hooks );
matchers( hooks );
