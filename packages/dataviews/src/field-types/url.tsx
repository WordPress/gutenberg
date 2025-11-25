/**
 * Internal dependencies
 */
import type { DataViewRenderFieldProps, SortDirection } from '../types';
import type { TypeProvidedProps } from '../types/private';
import RenderFromElements from './utils/render-from-elements';
import {
	OPERATOR_IS,
	OPERATOR_IS_ALL,
	OPERATOR_IS_NOT_ALL,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_IS_NOT,
	OPERATOR_CONTAINS,
	OPERATOR_NOT_CONTAINS,
	OPERATOR_STARTS_WITH,
} from '../constants';

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	return field.hasElements ? (
		<RenderFromElements item={ item } field={ field } />
	) : (
		field.getValue( { item } )
	);
}

const sort = ( a: any, b: any, direction: SortDirection ) => {
	return direction === 'asc' ? a.localeCompare( b ) : b.localeCompare( a );
};

export default {
	type: 'url',
	render,
	Edit: 'url',
	sort,
	isValid: {
		elements: true,
		custom: () => null,
	},
	enableSorting: true,
	enableGlobalSearch: false,
	defaultOperators: [ OPERATOR_IS_ANY, OPERATOR_IS_NONE ],
	validOperators: [
		OPERATOR_IS,
		OPERATOR_IS_NOT,
		OPERATOR_CONTAINS,
		OPERATOR_NOT_CONTAINS,
		OPERATOR_STARTS_WITH,
		// Multiple selection
		OPERATOR_IS_ANY,
		OPERATOR_IS_NONE,
		OPERATOR_IS_ALL,
		OPERATOR_IS_NOT_ALL,
	],
	getFormat: () => ( {} ),
} satisfies TypeProvidedProps< any >;
