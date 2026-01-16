/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { FormatInteger, NormalizedField } from '../types';
import type { FieldType } from '../types/private';
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
import sort from './utils/sort-number';
import isValidRequired from './utils/is-valid-required';
import isValidMin from './utils/is-valid-min';
import isValidMax from './utils/is-valid-max';
import isValidElements from './utils/is-valid-elements';
import render from './utils/render-default';

const format = {
	separatorThousand: ',',
};

function getValueFormatted< Item >( {
	item,
	field,
}: {
	item: Item;
	field: NormalizedField< Item >;
} ): string {
	let value = field.getValue( { item } );
	if ( value === null || value === undefined ) {
		return '';
	}

	value = Number( value );
	if ( ! Number.isFinite( value ) ) {
		return String( value );
	}

	let formatInteger: Required< FormatInteger >;
	if ( field.type !== 'integer' ) {
		formatInteger = format;
	} else {
		formatInteger = field.format as Required< FormatInteger >;
	}

	const { separatorThousand } = formatInteger;
	const integerValue = Math.trunc( value );
	if ( ! separatorThousand ) {
		return String( integerValue );
	}

	return String( integerValue ).replace(
		/\B(?=(\d{3})+(?!\d))/g,
		separatorThousand
	);
}

function isValidCustom< Item >( item: Item, field: NormalizedField< Item > ) {
	const value = field.getValue( { item } );
	if (
		! [ undefined, '', null ].includes( value ) &&
		! Number.isInteger( value )
	) {
		return __( 'Value must be an integer.' );
	}
	return null;
}

export default {
	type: 'integer',
	render,
	Edit: 'integer',
	sort,
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
	format,
	getValueFormatted,
	validate: {
		required: isValidRequired,
		min: isValidMin,
		max: isValidMax,
		elements: isValidElements,
		custom: isValidCustom,
	},
} satisfies FieldType< any >;
