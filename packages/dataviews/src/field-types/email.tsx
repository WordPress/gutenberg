/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../types';
import type { FieldType } from '../types/private';
import {
	OPERATOR_IS,
	OPERATOR_IS_ALL,
	OPERATOR_IS_NOT_ALL,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_IS_NOT,
	OPERATOR_CONTAINS,
	OPERATOR_NOT_CONTAINS,
	OPERATOR_STARTS_WITH,
} from '../constants';
import render from './utils/render-default';
import sort from './utils/sort-text';
import isValidRequired from './utils/is-valid-required';
import isValidMinLength from './utils/is-valid-min-length';
import isValidMaxLength from './utils/is-valid-max-length';
import isValidPattern from './utils/is-valid-pattern';
import isValidElements from './utils/is-valid-elements';
import getValueFormatted from './utils/get-value-formatted-default';

// Email validation regex based on HTML5 spec
// https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
const emailRegex =
	/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function isValidCustom< Item >( item: Item, field: NormalizedField< Item > ) {
	const value = field.getValue( { item } );

	if (
		! [ undefined, '', null ].includes( value ) &&
		! emailRegex.test( value )
	) {
		return __( 'Value must be a valid email address.' );
	}

	return null;
}

export default {
	type: 'email',
	render,
	Edit: 'email',
	sort,
	enableSorting: true,
	enableGlobalSearch: false,
	defaultOperators: [ OPERATOR_IS_ANY, OPERATOR_IS_NONE ],
	validOperators: [
		OPERATOR_IS,
		OPERATOR_IS_NOT,
		OPERATOR_CONTAINS,
		OPERATOR_NOT_CONTAINS,
		OPERATOR_STARTS_WITH,
		// Multiple selection
		OPERATOR_IS_ANY,
		OPERATOR_IS_NONE,
		OPERATOR_IS_ALL,
		OPERATOR_IS_NOT_ALL,
	],
	format: {},
	getValueFormatted,
	validate: {
		required: isValidRequired,
		pattern: isValidPattern,
		minLength: isValidMinLength,
		maxLength: isValidMaxLength,
		elements: isValidElements,
		custom: isValidCustom,
	},
} satisfies FieldType< any >;
