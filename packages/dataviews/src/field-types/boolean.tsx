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
	Rules,
	SortDirection,
} from '../types';
import type { TypeProvidedProps } from '../types/private';
import RenderFromElements from './utils/render-from-elements';
import { OPERATOR_IS, OPERATOR_IS_NOT } from '../constants';
import getValueFromId from './utils/get-value-from-id';

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

const isValid: Rules< any > = {
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

export default function normalizeField< Item >(
	field: Field< Item >
): TypeProvidedProps< Item > {
	const getValue = field.getValue || getValueFromId( field.id );

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

	return {
		type: 'boolean',
		render,
		Edit: 'checkbox',
		sort,
		isValid,
		enableSorting: true,
		enableGlobalSearch: false,
		defaultOperators: [ OPERATOR_IS, OPERATOR_IS_NOT ],
		validOperators: [ OPERATOR_IS, OPERATOR_IS_NOT ],
		getFormat: () => ( {} ),
	};
}
