/**
 * Internal dependencies
 */
import type { DataViewRenderFieldProps, SortDirection } from '../types';
import type { TypeProvidedProps } from '../types/private';
import RenderFromElements from './utils/render-from-elements';
import { ALL_OPERATORS, OPERATOR_IS, OPERATOR_IS_NOT } from '../constants';

const render = ( {
	item,
	field: normalizedField,
}: DataViewRenderFieldProps< any > ) => {
	return normalizedField.hasElements ? (
		<RenderFromElements item={ item } field={ normalizedField } />
	) : (
		normalizedField.getValue( { item } )
	);
};

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
