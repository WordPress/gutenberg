<?php
/**
 * Experimental editor features config functionality.
 *
 * @package gutenberg
 */

/**
 * Returns the default config for editor features,
 * or an empty array if none found.
 *
 * @return array Default features config for the editor.
 */
function gutenberg_experimental_get_editor_features_config() {
	$empty_config = array();
	$config_path  = __DIR__ . '/experimental-default-theme.json';
	if ( ! file_exists( $config_path ) ) {
		return $empty_config;
	}

	$theme_config = json_decode(
		@file_get_contents( $config_path ),
		true
	);
	if (
		empty( $theme_config['global']['features'] ) ||
		! is_array( $theme_config['global']['features'] )
	) {
		return $empty_config;
	}

	return $theme_config['global']['features'];
}


/**
 * Extends editor settings with the features loaded from default config.
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_extend_settings_editor_features( $settings ) {
	$editor_features                    = gutenberg_experimental_get_editor_features_config();
	$settings['__experimentalFeatures'] = $editor_features;

	return $settings;
}
add_filter( 'block_editor_settings', 'gutenberg_extend_settings_editor_features' );
