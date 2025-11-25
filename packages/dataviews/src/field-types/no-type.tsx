/**
 * Internal dependencies
 */
import type { SortDirection } from '../types';
import type { TypeProvidedProps } from '../types/private';
import { ALL_OPERATORS, OPERATOR_IS, OPERATOR_IS_NOT } from '../constants';
import render from './utils/render-default';

const sort = ( a: any, b: any, direction: SortDirection ) => {
	if ( typeof a === 'number' && typeof b === 'number' ) {
		return direction === 'asc' ? a - b : b - a;
	}

	return direction === 'asc' ? a.localeCompare( b ) : b.localeCompare( a );
};

export default {
	// type: no type for this one
	render,
	Edit: null,
	sort,
	isValid: {
		elements: true,
		custom: () => null,
	},
	enableSorting: true,
	enableGlobalSearch: false,
	defaultOperators: [ OPERATOR_IS, OPERATOR_IS_NOT ],
	validOperators: ALL_OPERATORS,
	getFormat: () => ( {} ),
} satisfies TypeProvidedProps< any >;
