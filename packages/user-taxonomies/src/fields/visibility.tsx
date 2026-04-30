/**
 * WordPress dependencies
 */
import type { Field, Form } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { TaxonomyFormData } from '../types';

type VisibilityKey =
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

function booleanField(
	id: VisibilityKey,
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

export const showInRestField = booleanField(
	'show_in_rest',
	__( 'Show in REST API' ),
	{
		description: __(
			'Required for the block editor. Turn off only for taxonomies that should not be exposed via REST.'
		),
	}
);

export const publiclyQueryableField = booleanField(
	'publicly_queryable',
	__( 'Publicly queryable' ),
	{
		description: __(
			'Whether front-end queries (e.g. ?taxonomy=…&term=…) can return terms from this taxonomy.'
		),
	}
);

export const showUiField = booleanField( 'show_ui', __( 'Show admin UI' ), {
	description: __(
		'Whether to generate a default admin interface for managing terms.'
	),
} );

export const showInMenuField = booleanField(
	'show_in_menu',
	__( 'Show in admin menu' ),
	{
		description: __(
			'Whether to show the taxonomy in the admin menu. Has no effect when Show admin UI is off; the value is preserved either way.'
		),
		// Hide when `show_ui` is off — `show_in_menu` is silently ignored by
		// register_taxonomy() in that case, so showing the toggle would be
		// misleading. The stored value is preserved across the toggle.
		isVisible: ( item ) => item.config.show_ui,
	}
);

export const showInQuickEditField = booleanField(
	'show_in_quick_edit',
	__( 'Show in Quick Edit' ),
	{
		description: __(
			'Whether to show the taxonomy in the Quick/Bulk Edit panel.'
		),
	}
);

export const showAdminColumnField = booleanField(
	'show_admin_column',
	__( 'Show admin column' ),
	{
		description: __(
			'Whether to display a column for the taxonomy on the associated post type list tables.'
		),
	}
);

export const showInNavMenusField = booleanField(
	'show_in_nav_menus',
	__( 'Available in nav menus' ),
	{
		description: __(
			'Whether terms are selectable in the theme nav menu builder.'
		),
	}
);

export const showTagcloudField = booleanField(
	'show_tagcloud',
	__( 'Available in Tag Cloud widget' ),
	{
		description: __(
			'Whether terms can be displayed in the Tag Cloud widget.'
		),
	}
);

export const visibilityFormFields: Form[ 'fields' ] = [
	'show_in_rest',
	'publicly_queryable',
	'show_ui',
	'show_in_menu',
	'show_in_quick_edit',
	'show_in_nav_menus',
	'show_tagcloud',
	'show_admin_column',
];
