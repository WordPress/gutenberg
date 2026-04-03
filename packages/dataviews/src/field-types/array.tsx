/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	NormalizedField,
	SortDirection,
} from '../types';
import type { FieldType } from '../types/private';
import {
	OPERATOR_IS_ALL,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_IS_NOT_ALL,
} from '../constants';
import isValidRequiredForArray from './utils/is-valid-required-for-array';
import isValidElements from './utils/is-valid-elements';

function getValueFormatted< Item >( {
	item,
	field,
}: {
	item: Item;
	field: NormalizedField< Item >;
} ): string {
	const value = field.getValue( { item } );
	const arr = Array.isArray( value ) ? value : [];
	return arr.join( ', ' );
}

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	return getValueFormatted( { item, field } );
}

function isValidCustom< Item >( item: Item, field: NormalizedField< Item > ) {
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
}

const sort = ( a: any, b: any, direction: SortDirection ) => {
	// Sort arrays by length, then alphabetically by joined string
	const arrA = Array.isArray( a ) ? a : [];
	const arrB = Array.isArray( b ) ? b : [];
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

export default {
	type: 'array',
	render,
	Edit: 'array',
	sort,
	enableSorting: true,
	enableGlobalSearch: false,
	defaultOperators: [ OPERATOR_IS_ANY, OPERATOR_IS_NONE ],
	validOperators: [
		OPERATOR_IS_ANY,
		OPERATOR_IS_NONE,
		OPERATOR_IS_ALL,
		OPERATOR_IS_NOT_ALL,
	],
	format: {},
	getValueFormatted,
	validate: {
		required: isValidRequiredForArray,
		elements: isValidElements,
		custom: isValidCustom,
	},
} satisfies FieldType< any >;
