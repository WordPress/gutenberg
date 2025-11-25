/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { DataViewRenderFieldProps, Rules, SortDirection } from '../types';
import type { TypeProvidedProps } from '../types/private';
import RenderFromElements from './utils/render-from-elements';
import {
	OPERATOR_IS,
	OPERATOR_IS_NOT,
	OPERATOR_LESS_THAN,
	OPERATOR_GREATER_THAN,
	OPERATOR_LESS_THAN_OR_EQUAL,
	OPERATOR_GREATER_THAN_OR_EQUAL,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_IS_ALL,
	OPERATOR_IS_NOT_ALL,
	OPERATOR_BETWEEN,
} from '../constants';

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	return field.hasElements ? (
		<RenderFromElements item={ item } field={ field } />
	) : (
		field.getValue( { item } )
	);
}

const isValid: Rules< any > = {
	elements: true,
	custom: ( item: any, normalizedField ) => {
		const value = normalizedField.getValue( { item } );
		if (
			! [ undefined, '', null ].includes( value ) &&
			! Number.isInteger( value )
		) {
			return __( 'Value must be an integer.' );
		}

		return null;
	},
};

const sort = ( a: any, b: any, direction: SortDirection ) => {
	return direction === 'asc' ? a - b : b - a;
};

export default function normalizeField< Item >(): TypeProvidedProps< Item > {
	return {
		type: 'integer',
		render,
		Edit: 'integer',
		sort,
		isValid,
		enableSorting: true,
		enableGlobalSearch: false,
		defaultOperators: [
			OPERATOR_IS,
			OPERATOR_IS_NOT,
			OPERATOR_LESS_THAN,
			OPERATOR_GREATER_THAN,
			OPERATOR_LESS_THAN_OR_EQUAL,
			OPERATOR_GREATER_THAN_OR_EQUAL,
			OPERATOR_BETWEEN,
		],
		validOperators: [
			// Single-selection
			OPERATOR_IS,
			OPERATOR_IS_NOT,
			OPERATOR_LESS_THAN,
			OPERATOR_GREATER_THAN,
			OPERATOR_LESS_THAN_OR_EQUAL,
			OPERATOR_GREATER_THAN_OR_EQUAL,
			OPERATOR_BETWEEN,
			// Multiple-selection
			OPERATOR_IS_ANY,
			OPERATOR_IS_NONE,
			OPERATOR_IS_ALL,
			OPERATOR_IS_NOT_ALL,
		],
		getFormat: () => ( {} ),
	};
}
