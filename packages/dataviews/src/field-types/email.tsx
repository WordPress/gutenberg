/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Rules, SortDirection } from '../types';
import type { TypeProvidedProps } from '../types/private';
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

// Email validation regex based on HTML5 spec
// https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
const emailRegex =
	/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const isValid: Rules< any > = {
	elements: true,
	custom: ( item: any, normalizedField ) => {
		const value = normalizedField.getValue( { item } );

		if (
			! [ undefined, '', null ].includes( value ) &&
			! emailRegex.test( value )
		) {
			return __( 'Value must be a valid email address.' );
		}

		return null;
	},
};

const sort = ( a: any, b: any, direction: SortDirection ) => {
	return direction === 'asc' ? a.localeCompare( b ) : b.localeCompare( a );
};

export default {
	type: 'email',
	render,
	Edit: 'email',
	sort,
	isValid,
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
	getFormat: () => ( {} ),
} satisfies TypeProvidedProps< any >;
