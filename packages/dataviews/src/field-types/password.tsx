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

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function sort( valueA: any, valueB: any, direction: SortDirection ) {
	// Passwords should not be sortable for security reasons
	return 0;
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
	Edit: 'password',
	render: ( { item, field }: DataViewRenderFieldProps< any > ) => {
		return field.elements
			? renderFromElements( { item, field } )
			: '••••••••';
	},
	enableSorting: false,
	filterBy: false,
} satisfies FieldTypeDefinition< any >;
