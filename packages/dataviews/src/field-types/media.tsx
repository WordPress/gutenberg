/**
 * Internal dependencies
 */
import type { FieldType } from '../types/private';
import type { NormalizedField } from '../types';
import getValueFormatted from './utils/get-value-formatted-default';

function isEmpty( value: any ) {
	return [ 0, undefined, '', null ].includes( value );
}

function isValidRequired< Item >( item: Item, field: NormalizedField< Item > ) {
	const value = field.getValue( { item } );
	if ( Array.isArray( value ) ) {
		return !! value.length && value.some( ( v ) => ! isEmpty( v ) );
	}
	return ! isEmpty( value );
}

export default {
	type: 'media',
	render: () => null,
	Edit: null,
	sort: () => 0,
	enableSorting: false,
	enableGlobalSearch: false,
	defaultOperators: [],
	validOperators: [],
	format: {},
	getValueFormatted,
	validate: {
		required: isValidRequired,
	},
} satisfies FieldType< any >;
