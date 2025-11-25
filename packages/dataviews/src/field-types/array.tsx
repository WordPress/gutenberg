/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	Field,
	Rules,
	SortDirection,
} from '../types';
import type { TypeProvidedProps } from '../types/private';
import {
	OPERATOR_IS_ALL,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_IS_NOT_ALL,
} from '../constants';
import getValueFromId from './utils/get-value-from-id';

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	const value = field.getValue( { item } ) || [];
	return value.join( ', ' );
}

const isValid: Rules< any > = {
	elements: true,
	custom: ( item: any, normalizedField ) => {
		const value = normalizedField.getValue( { item } );

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
};

export default function normalizeField< Item >(
	field: Field< Item >
): TypeProvidedProps< Item > {
	const getValue = field.getValue || getValueFromId( field.id );

	const sort = ( a: any, b: any, direction: SortDirection ) => {
		// Sort arrays by length, then alphabetically by joined string
		const valueA = getValue( a );
		const valueB = getValue( b );
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
	};

	return {
		type: 'array',
		render,
		Edit: 'array',
		sort,
		isValid,
		enableSorting: true,
		enableGlobalSearch: false,
		defaultOperators: [ OPERATOR_IS_ANY, OPERATOR_IS_NONE ],
		validOperators: [
			OPERATOR_IS_ANY,
			OPERATOR_IS_NONE,
			OPERATOR_IS_ALL,
			OPERATOR_IS_NOT_ALL,
		],
		getFormat: () => ( {} ),
	};
}
