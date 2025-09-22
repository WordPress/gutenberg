/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { NormalizedField, FieldTypeDefinition } from '../types';

function sort() {
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
	Edit: null,
	render: () => null,
	enableSorting: false,
	filterBy: false,
} satisfies FieldTypeDefinition< any >;
