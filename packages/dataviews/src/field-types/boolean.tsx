/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { NormalizedField, SortDirection } from '../types';
import type { FieldType } from '../types/private';
import { OPERATOR_IS, OPERATOR_IS_NOT } from '../constants';
import isValidElements from './utils/is-valid-elements';
import isValidRequiredForBool from './utils/is-valid-required-for-bool';
import render from './utils/render-default';

function getValueFormatted< Item >( {
	item,
	field,
}: {
	item: Item;
	field: NormalizedField< Item >;
} ): string {
	const value = field.getValue( { item } );

	if ( value === true ) {
		return __( 'True' );
	}

	if ( value === false ) {
		return __( 'False' );
	}

	return '';
}

function isValidCustom< Item >( item: Item, field: NormalizedField< Item > ) {
	const value = field.getValue( { item } );

	if (
		! [ undefined, '', null ].includes( value ) &&
		! [ true, false ].includes( value )
	) {
		return __( 'Value must be true, false, or undefined' );
	}

	return null;
}

const sort = ( a: any, b: any, direction: SortDirection ) => {
	const boolA = Boolean( a );
	const boolB = Boolean( b );

	if ( boolA === boolB ) {
		return 0;
	}

	// In ascending order, false comes before true
	if ( direction === 'asc' ) {
		return boolA ? 1 : -1;
	}

	// In descending order, true comes before false
	return boolA ? -1 : 1;
};

export default {
	type: 'boolean',
	render,
	Edit: 'checkbox',
	sort,
	validate: {
		required: isValidRequiredForBool,
		elements: isValidElements,
		custom: isValidCustom,
	},
	enableSorting: true,
	enableGlobalSearch: false,
	defaultOperators: [ OPERATOR_IS, OPERATOR_IS_NOT ],
	validOperators: [ OPERATOR_IS, OPERATOR_IS_NOT ],
	format: {},
	getValueFormatted,
} satisfies FieldType< any >;
