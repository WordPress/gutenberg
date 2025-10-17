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
	FieldTypeDefinition,
	NormalizedField,
} from '../types';
import {
	OPERATOR_IS_ALL,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_IS_NOT_ALL,
} from '../constants';

// Sort arrays by length, then alphabetically by joined string
function sort( valueA: any, valueB: any, direction: SortDirection ) {
	const arrA = Array.isArray( valueA ) ? valueA : [];
	const arrB = Array.isArray( valueB ) ? valueB : [];
	if ( arrA.length !== arrB.length ) {
		return direction === 'asc'
			? arrA.length - arrB.length
			: arrB.length - arrA.length;
	}

	const joinedA = arrA.join( ',' );
	const joinedB = arrB.join( ',' );
	return direction === 'asc'
		? joinedA.localeCompare( joinedB )
		: joinedB.localeCompare( joinedA );
}

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	const value = field.getValue( { item } ) || [];
	return value.join( ', ' );
}

const arrayFieldType: FieldTypeDefinition< any > = {
	sort,
	isValid: {
		elements: true,
		custom: ( item: any, field: NormalizedField< any > ) => {
			const value = field.getValue( { item } );

			if (
				! [ undefined, '', null ].includes( value ) &&
				! Array.isArray( value )
			) {
				return __( 'Value must be an array.' );
			}

			// Only allow strings for now. Can be extended to other types in the future.
			if ( ! value.every( ( v: any ) => typeof v === 'string' ) ) {
				return __( 'Every value must be a string.' );
			}

			return null;
		},
	},
	Edit: 'array', // Use array control
	render,
	enableSorting: true,
	filterBy: {
		defaultOperators: [ OPERATOR_IS_ANY, OPERATOR_IS_NONE ],
		validOperators: [
			OPERATOR_IS_ANY,
			OPERATOR_IS_NONE,
			OPERATOR_IS_ALL,
			OPERATOR_IS_NOT_ALL,
		],
	},
};

export default arrayFieldType;
