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
import { getControl } from '../dataform-controls';
import hasElements from './utils/has-elements';
import getValueFromId from './utils/get-value-from-id';
import setValueFromId from './utils/set-value-from-id';
import getFilterBy from './utils/get-filter-by';

function isEmpty( value: unknown ): value is '' | undefined | null {
	return value === '' || value === undefined || value === null;
}

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	if ( field.hasElements ) {
		return <RenderFromElements item={ item } field={ field } />;
	}

	const value = field.getValue( { item } );
	if ( ! [ null, undefined ].includes( value ) ) {
		return Number( value ).toFixed( 2 );
	}

	return null;
}

export default function normalizeField< Item >(
	field: Field< Item >
): NormalizedField< Item > {
	const getValue = field.getValue || getValueFromId( field.id );
	const setValue = field.setValue || setValueFromId( field.id );
	const isValid: Rules< Item > = {
		elements: true,
		custom: ( item: any, normalizedField ) => {
			const value = normalizedField.getValue( { item } );

			if ( ! isEmpty( value ) && ! Number.isFinite( value ) ) {
				return __( 'Value must be a number.' );
			}

			return null;
		},
	};

	const sort = ( a: Item, b: Item, direction: SortDirection ) => {
		const valueA = getValue( { item: a } );
		const valueB = getValue( { item: b } );
		return direction === 'asc' ? valueA - valueB : valueB - valueA;
	};

	const defaultOperators: Operator[] = [
		OPERATOR_IS,
		OPERATOR_IS_NOT,
		OPERATOR_LESS_THAN,
		OPERATOR_GREATER_THAN,
		OPERATOR_LESS_THAN_OR_EQUAL,
		OPERATOR_GREATER_THAN_OR_EQUAL,
		OPERATOR_BETWEEN,
	];

	const validOperators: Operator[] = [
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
	];

	return {
		id: field.id,
		type: 'number',
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
		Edit: getControl( field, 'number' ),
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
