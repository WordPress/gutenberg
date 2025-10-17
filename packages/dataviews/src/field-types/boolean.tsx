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
	FieldTypeDefinition,
	NormalizedField,
} from '../types';
import renderFromElements from './utils/render-from-elements';
import { OPERATOR_IS, OPERATOR_IS_NOT } from '../constants';

function sort( a: any, b: any, direction: SortDirection ) {
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
}

export default {
	sort,
	isValid: {
		elements: true,
		custom: ( item: any, field: NormalizedField< any > ) => {
			const value = field.getValue( { item } );

			if (
				! [ undefined, '', null ].includes( value ) &&
				! [ true, false ].includes( value )
			) {
				return __( 'Value must be true, false, or undefined' );
			}

			return null;
		},
	},
	Edit: 'checkbox',
	render: ( { item, field }: DataViewRenderFieldProps< any > ) => {
		if ( field.elements ) {
			return renderFromElements( { item, field } );
		}

		if ( field.getValue( { item } ) === true ) {
			return __( 'True' );
		}

		if ( field.getValue( { item } ) === false ) {
			return __( 'False' );
		}

		return null;
	},
	enableSorting: true,
	filterBy: {
		defaultOperators: [ OPERATOR_IS, OPERATOR_IS_NOT ],
		validOperators: [ OPERATOR_IS, OPERATOR_IS_NOT ],
	},
} satisfies FieldTypeDefinition< any >;
