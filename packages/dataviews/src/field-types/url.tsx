/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	SortDirection,
	FieldTypeDefinition,
} from '../types';
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

function sort( valueA: any, valueB: any, direction: SortDirection ) {
	return direction === 'asc'
		? valueA.localeCompare( valueB )
		: valueB.localeCompare( valueA );
}

export default {
	sort,
	isValid: {
		elements: true,
		custom: () => null,
	},
	Edit: 'url',
	render: ( { item, field }: DataViewRenderFieldProps< any > ) => {
		return field.hasElements ? (
			<RenderFromElements item={ item } field={ field } />
		) : (
			field.getValue( { item } )
		);
	},
	enableSorting: true,
	filterBy: {
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
	},
} satisfies FieldTypeDefinition< any >;
