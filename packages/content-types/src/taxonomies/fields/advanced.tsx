/**
 * WordPress dependencies
 */
import type { Field, Form } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createBooleanField } from '../../utils/fields';
import type { TaxonomyFormData } from '../types';

export const sortField = createBooleanField( 'sort', __( 'Sort terms' ), {
	description: __(
		'Whether terms in this taxonomy should be saved in the order they are assigned to an item.'
	),
} );

export const defaultTermEnabledField = createBooleanField(
	'default_term_enabled',
	__( 'Set a default term' ),
	{
		description: __(
			'Default term to be used for the taxonomy, similar to how "Uncategorized" works for categories.'
		),
	}
);

export const defaultTermNameField: Field< TaxonomyFormData > = {
	id: 'default_term_name',
	label: __( 'Default term name' ),
	type: 'text',
	description: __(
		"Once saved, updating the name creates a new term — the previous default term remains in the terms list. To change the term's slug or description, edit it from the terms list."
	),
	getValue: ( { item } ) => item.config.default_term.name,
	setValue: ( { item, value } ) => ( {
		config: {
			...item.config,
			default_term: { name: String( value ?? '' ) },
		},
	} ),
	isValid: {
		// `useFormValidity` does not skip invisible fields, so `required:
		// true` would mark the form invalid whenever the toggle is off.
		// Gate the requirement on the toggle via `custom` instead.
		custom: ( item ) => {
			if ( ! item.config.default_term_enabled ) {
				return null;
			}
			return item.config.default_term.name.trim()
				? null
				: __( 'A default term name is required.' );
		},
		// Mirrors `wp_terms.name` column width (varchar(200)).
		maxLength: 200,
	},
	isVisible: ( item ) => item.config.default_term_enabled,
	enableSorting: false,
	filterBy: false,
};

export const advancedFormFields: Form[ 'fields' ] = [
	'sort',
	'default_term_enabled',
	'default_term_name',
];
