/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { TaxonomyFormData } from '../types';

type BooleanConfigKey =
	| 'public'
	| 'hierarchical'
	| 'publicly_queryable'
	| 'show_ui'
	| 'show_in_menu'
	| 'show_in_nav_menus'
	| 'show_tagcloud'
	| 'show_in_quick_edit'
	| 'show_admin_column'
	| 'show_in_rest';

type BooleanOptions = {
	description: string;
	isVisible?: ( item: TaxonomyFormData ) => boolean;
};

export function booleanField(
	id: BooleanConfigKey,
	label: string,
	options: BooleanOptions
): Field< TaxonomyFormData > {
	const field: Field< TaxonomyFormData > = {
		id,
		label,
		type: 'boolean',
		description: options.description,
		Edit: 'toggle',
		getValue: ( { item } ) => item.config[ id ],
		setValue: ( { item, value } ) => ( {
			config: { ...item.config, [ id ]: !! value },
		} ),
		filterBy: false,
		enableSorting: false,
	};
	if ( options.isVisible ) {
		field.isVisible = options.isVisible;
	}
	return field;
}
