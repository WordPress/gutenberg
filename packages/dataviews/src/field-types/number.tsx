/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	SortDirection,
	NormalizedField,
	FieldTypeDefinition,
} from '../types';
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

function sort( a: any, b: any, direction: SortDirection ) {
	return direction === 'asc' ? a - b : b - a;
}

function isEmpty( value: unknown ): value is '' | undefined | null {
	return value === '' || value === undefined || value === null;
}

export function getValidation( isInteger = false ) {
	return ( item: any, field: NormalizedField< any > ) => {
		const value = field.getValue( { item } );

		if ( isEmpty( value ) ) {
			return null;
		}

		const numericValue = Number( value );

		if ( isInteger ) {
			if ( ! Number.isInteger( numericValue ) ) {
				return __( 'Value must be an integer.' );
			}
		} else if ( ! Number.isFinite( numericValue ) ) {
			return __( 'Value must be a number.' );
		}

		if ( field?.elements ) {
			const isMember = field.elements.some(
				( element ) =>
					Number.isFinite( Number( element.value ) ) &&
					Number( element.value ) === numericValue
			);
			if ( ! isMember ) {
				return __( 'Value must be one of the elements.' );
			}
		}

		return null;
	};
}

export default {
	sort,
	isValid: {
		custom: getValidation(),
	},
	Edit: 'number',
	render: ( { item, field }: DataViewRenderFieldProps< any > ) => {
		const value = field.getValue( { item } );
		if ( ! isEmpty( value ) && field.elements ) {
			const numericValue = Number( value );
			const match = field.elements.find(
				( element ) =>
					Number.isFinite( Number( element.value ) ) &&
					Number( element.value ) === numericValue
			);
			if ( match ) {
				return match.label;
			}
		}
		return value;
	},
	enableSorting: true,
	filterBy: {
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
	},
} satisfies FieldTypeDefinition< any >;
