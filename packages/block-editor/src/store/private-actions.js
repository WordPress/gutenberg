/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';

/**
 * A list of private/experimental block editor settings that
 * should not become a part of the WordPress public API.
 * BlockEditorProvider will remove these settings from the
 * settings object it receives.
 *
 * @see https://github.com/WordPress/gutenberg/pull/46131
 */
const privateSettings = [
	'inserterMediaCategories',
	'blockInspectorAnimation',
];

/**
 * Action that updates the block editor settings and
 * conditionally preserves the experimental ones.
 *
 * @param {Object}  settings                  Updated settings
 * @param {boolean} stripExperimentalSettings Whether to strip experimental settings.
 * @return {Object} Action object
 */
export function __experimentalUpdateSettings(
	settings,
	stripExperimentalSettings = false
) {
	let cleanSettings = settings;
	// There are no plugins in the mobile apps, so there is no
	// need to strip the experimental settings:
	if ( stripExperimentalSettings && Platform.OS === 'web' ) {
		cleanSettings = {};
		for ( const key in settings ) {
			if ( ! privateSettings.includes( key ) ) {
				cleanSettings[ key ] = settings[ key ];
			}
		}
	}
	return {
		type: 'UPDATE_SETTINGS',
		settings: cleanSettings,
	};
}

/**
 * Hides the block interface (eg. toolbar, outline, etc.)
 *
 * @return {Object} Action object.
 */
export function hideBlockInterface() {
	return {
		type: 'HIDE_BLOCK_INTERFACE',
	};
}

/**
 * Shows the block interface (eg. toolbar, outline, etc.)
 *
 * @return {Object} Action object.
 */
export function showBlockInterface() {
	return {
		type: 'SHOW_BLOCK_INTERFACE',
	};
}
