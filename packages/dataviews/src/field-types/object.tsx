/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../types';
import type { FieldType } from '../types/private';
import render from './utils/render-default';

/**
 * Format object value for display.
 */
function getValueFormatted< Item >( {
	item,
	field,
}: {
	item: Item;
	field: NormalizedField< Item >;
} ): string {
	const value = field.getValue( { item } );

	if ( value === undefined || value === null ) {
		return '';
	}

	if ( typeof value !== 'object' ) {
		return String( value );
	}

	return Object.values( value ).filter( Boolean ).join( ', ' );
}

/**
 * Validate that value is an object.
 */
function isValidCustom< Item >( item: Item, field: NormalizedField< Item > ) {
	const value = field.getValue( { item } );

	if ( [ undefined, '', null ].includes( value ) ) {
		return null;
	}

	if ( typeof value !== 'object' ) {
		return __( 'Value must be an object.' );
	}

	return null;
}

export default {
	type: 'object',
	render,
	Edit: 'object',
	sort: () => 0,
	enableSorting: false,
	enableGlobalSearch: false,
	defaultOperators: [],
	validOperators: [],
	format: {},
	getValueFormatted,
	validate: {
		custom: isValidCustom,
	},
} satisfies FieldType< any >;
