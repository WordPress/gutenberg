/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

function updateNavigationLinkSettings( settings, name ) {
	if ( name !== 'core/navigation-link' ) {
		return settings;
	}

	return {
		...settings,
		supports: {
			customClassName: false,
			html: false,
			inserter: true,
		},
		// Make the nav link block usable globally.
		parent: undefined,
	};
}

export default () =>
	addFilter(
		'blocks.registerBlockType',
		'core/edit-navigation/update-navigation-link-settings',
		updateNavigationLinkSettings
	);
