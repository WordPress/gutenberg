/**
 * WordPress dependencies
 */
import type { Form } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createBooleanField } from '../../utils/fields';

export const showInNavMenusField = createBooleanField(
	'show_in_nav_menus',
	__( 'Available in nav menus' ),
	{
		description: __(
			'Whether posts of this type are available for selection in navigation menus.'
		),
	}
);

export const showUiField = createBooleanField(
	'show_ui',
	__( 'Show admin UI' ),
	{
		description: __(
			'Whether to generate a default UI for managing posts of this type in the admin.'
		),
	}
);

export const showInMenuField = createBooleanField(
	'show_in_menu',
	__( 'Show in admin menu' ),
	{
		description: __(
			'Whether to show the post type in the WordPress admin menu. Has no effect when Show admin UI is off; the value is preserved either way.'
		),
		// Hidden when `show_ui` is off — `show_in_menu` is silently ignored
		// by register_post_type() in that case, so showing the toggle would
		// be misleading. The stored value is preserved across the toggle.
		isVisible: ( item ) => !! item.config.show_ui,
	}
);

export const showInAdminBarField = createBooleanField(
	'show_in_admin_bar',
	__( 'Show in admin bar' ),
	{
		description: __(
			'Whether to include this post type in the "New" menu of the WordPress admin toolbar.'
		),
	}
);

export const visibilityFormFields: Form[ 'fields' ] = [
	'show_in_nav_menus',
	'show_ui',
	'show_in_menu',
	'show_in_admin_bar',
];
