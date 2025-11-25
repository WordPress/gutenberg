/**
 * Internal dependencies
 */
import type { SortDirection } from '../types';
import type { FieldType } from '../types/private';
import { ALL_OPERATORS, OPERATOR_IS, OPERATOR_IS_NOT } from '../constants';
import render from './utils/render-default';
import sortText from './utils/sort-text';
import sortNumber from './utils/sort-number';

const sort = ( a: any, b: any, direction: SortDirection ) => {
	if ( typeof a === 'number' && typeof b === 'number' ) {
		return sortNumber( a, b, direction );
	}

	return sortText( a, b, direction );
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
} satisfies FieldType< any >;
