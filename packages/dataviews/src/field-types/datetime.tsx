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
	NormalizedField,
	FieldTypeDefinition,
} from '../types';
import { renderFromElements } from '../utils';
import {
	OPERATOR_ON,
	OPERATOR_NOT_ON,
	OPERATOR_BEFORE,
	OPERATOR_AFTER,
	OPERATOR_BEFORE_INC,
	OPERATOR_AFTER_INC,
	OPERATOR_IN_THE_PAST,
	OPERATOR_OVER,
} from '../constants';

function sort( a: any, b: any, direction: SortDirection ) {
	const timeA = new Date( a ).getTime();
	const timeB = new Date( b ).getTime();

	return direction === 'asc' ? timeA - timeB : timeB - timeA;
}

export default {
	sort,
	isValid: {
		custom: ( item: any, field: NormalizedField< any > ) => {
			const value = field.getValue( { item } );
			if ( field?.elements ) {
				const validValues = field.elements.map( ( f ) => f.value );
				if ( ! validValues.includes( value ) ) {
					return __( 'Value must be one of the elements.' );
				}
			}

			return null;
		},
	},
	Edit: 'datetime',
	render: ( { item, field }: DataViewRenderFieldProps< any > ) => {
		return field.elements
			? renderFromElements( { item, field } )
			: field.getValue( { item } );
	},
	enableSorting: true,
	filterBy: {
		defaultOperators: [
			OPERATOR_ON,
			OPERATOR_NOT_ON,
			OPERATOR_BEFORE,
			OPERATOR_AFTER,
			OPERATOR_BEFORE_INC,
			OPERATOR_AFTER_INC,
			OPERATOR_IN_THE_PAST,
			OPERATOR_OVER,
		],
		validOperators: [
			OPERATOR_ON,
			OPERATOR_NOT_ON,
			OPERATOR_BEFORE,
			OPERATOR_AFTER,
			OPERATOR_BEFORE_INC,
			OPERATOR_AFTER_INC,
			OPERATOR_IN_THE_PAST,
			OPERATOR_OVER,
		],
	},
} satisfies FieldTypeDefinition< any >;
