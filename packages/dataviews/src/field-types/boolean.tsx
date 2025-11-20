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
import RenderFromElements from './utils/render-from-elements';
import { OPERATOR_IS, OPERATOR_IS_NOT } from '../constants';
import { getControl } from '../dataform-controls';
import hasElements from './utils/has-elements';
import getValueFromId from './utils/get-value-from-id';
import setValueFromId from './utils/set-value-from-id';
import getFilterBy from './utils/get-filter-by';

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	if ( field.hasElements ) {
		return <RenderFromElements item={ item } field={ field } />;
	}

	if ( field.getValue( { item } ) === true ) {
		return __( 'True' );
	}

	if ( field.getValue( { item } ) === false ) {
		return __( 'False' );
	}

	return null;
}

export default function normalizeField< Item >(
	field: Field< Item >
): NormalizedField< Item > {
	const getValue = field.getValue || getValueFromId( field.id );
	const setValue = field.setValue || setValueFromId( field.id );

	const sort = ( a: any, b: any, direction: SortDirection ) => {
		const valueA = getValue( { item: a } );
		const valueB = getValue( { item: b } );
		const boolA = Boolean( valueA );
		const boolB = Boolean( valueB );

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

	const isValid: Rules< Item > = {
		elements: true,
		custom: ( item: any, normalizedField ) => {
			const value = normalizedField.getValue( { item } );

			if (
				! [ undefined, '', null ].includes( value ) &&
				! [ true, false ].includes( value )
			) {
				return __( 'Value must be true, false, or undefined' );
			}

			return null;
		},
	};

	const defaultOperators: Operator[] = [ OPERATOR_IS, OPERATOR_IS_NOT ];

	const validOperators: Operator[] = [ OPERATOR_IS, OPERATOR_IS_NOT ];

	return {
		id: field.id,
		type: 'boolean',
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
		Edit: getControl( field, 'checkbox' ),
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
