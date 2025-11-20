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
	NormalizedField,
	Operator,
	Rules,
	SortDirection,
} from '../types';
import {
	OPERATOR_IS_ALL,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_IS_NOT_ALL,
} from '../constants';
import { getControl } from '../dataform-controls';
import hasElements from './utils/has-elements';
import getValueFromId from './utils/get-value-from-id';
import setValueFromId from './utils/set-value-from-id';
import getFilterBy from './utils/get-filter-by';

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	const value = field.getValue( { item } ) || [];
	return value.join( ', ' );
}

const defaultOperators: Operator[] = [ OPERATOR_IS_ANY, OPERATOR_IS_NONE ];
const validOperators: Operator[] = [
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_IS_ALL,
	OPERATOR_IS_NOT_ALL,
];

export default function normalizeField< Item >(
	field: Field< Item >
): NormalizedField< Item > {
	const getValue = field.getValue || getValueFromId( field.id );
	const setValue = field.setValue || setValueFromId( field.id );

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

	const isValid: Rules< Item > = {
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

	return {
		id: field.id,
		type: 'array',
		label: field.label || field.id,
		header: field.header || field.label || field.id,
		description: field.description,
		placeholder: field.placeholder,
		getValue,
		setValue,
		elements: field.elements,
		getElements: field.getElements,
		hasElements: hasElements( field ),
		render: field.render ?? render,
		Edit: getControl( field, 'array' ),
		sort: field.sort ?? sort,
		isValid: {
			...isValid,
			...field.isValid,
		},
		isVisible: field.isVisible,
		enableSorting: field.enableSorting ?? true,
		enableGlobalSearch: field.enableGlobalSearch ?? false,
		enableHiding: field.enableHiding ?? true,
		readOnly: field.readOnly ?? false,
		filterBy: getFilterBy( field, defaultOperators, validOperators ),
		format: {},
	};
}
