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
	FormatInteger,
	NormalizedField,
} from '../types';
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
import RenderFromElements from './utils/render-from-elements';
import sort from './utils/sort-number';
import isValidRequired from './utils/is-valid-required';
import isValidMin from './utils/is-valid-min';
import isValidMax from './utils/is-valid-max';
import isValidElements from './utils/is-valid-elements';

function getFormat< Item >( field: Field< Item > ): Required< FormatInteger > {
	const fieldFormat = field.format as FormatInteger | undefined;
	return {
		separatorThousand:
			fieldFormat?.separatorThousand !== undefined &&
			typeof fieldFormat.separatorThousand === 'string'
				? fieldFormat.separatorThousand
				: ',',
	};
}

export function formatInteger(
	value: number,
	format: Required< FormatInteger >
): string {
	if ( ! Number.isFinite( value ) ) {
		return String( value );
	}
	const { separatorThousand } = format;
	const integerValue = Math.trunc( value );
	if ( ! separatorThousand ) {
		return String( integerValue );
	}
	// Add thousand separators.
	return String( integerValue ).replace(
		/\B(?=(\d{3})+(?!\d))/g,
		separatorThousand
	);
}

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	if ( field.hasElements ) {
		return <RenderFromElements item={ item } field={ field } />;
	}

	const value = field.getValue( { item } );
	if ( [ null, undefined ].includes( value ) ) {
		return '';
	}

	// If the field type is integer, we've already normalized the format,
	// and so it's safe to tell TypeScript to trust us ("as Required<FormatInteger>").
	//
	// There're no runtime paths where this render function is called with a non-integer field,
	// but TypeScript is unable to infer this, hence the type assertion.
	let format: Required< FormatInteger >;
	if ( field.type !== 'integer' ) {
		format = getFormat( field as Field< any > );
	} else {
		format = field.format as Required< FormatInteger >;
	}

	return formatInteger( Number( value ), format );
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
	getFormat,
	validate: {
		required: isValidRequired,
		min: isValidMin,
		max: isValidMax,
		elements: isValidElements,
		custom: isValidCustom,
	},
} satisfies FieldType< any >;
