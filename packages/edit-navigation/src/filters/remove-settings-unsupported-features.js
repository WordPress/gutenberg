/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

function removeNavigationBlockSettingsUnsupportedFeatures( settings, name ) {
	if ( name !== 'core/navigation' ) {
		return settings;
	}

	return {
		...settings,
		supports: {
			customClassName: false,
			html: false,
			inserter: true,
		},
		// Remove any block variations.
		variations: undefined,
	};
}

export default () =>
	addFilter(
		'blocks.registerBlockType',
		'core/edit-navigation/remove-navigation-block-settings-unsupported-features',
		removeNavigationBlockSettingsUnsupportedFeatures
	);
