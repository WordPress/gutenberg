<?php
/**
 * Adds settings to the block editor.
 *
 * @package gutenberg
 */

/**
 * Adds styles and __experimentalFeatures to the block editor settings.
 *
 * @param array $settings Existing block editor settings.
 *
 * @return array New block editor settings.
 */
function gutenberg_get_block_editor_settings_6_2( $settings ) {
	if ( wp_theme_has_theme_json() ) {
		// Add the custom CSS as separate style sheet so any invalid CSS entered by users does not break other global styles.
		$settings['styles'][] = array(
			'css'            => gutenberg_get_global_styles_custom_css(),
			'__unstableType' => 'user',
			'isGlobalStyles' => true,
		);
	}

	return $settings;
}

add_filter( 'block_editor_settings_all', 'gutenberg_get_block_editor_settings_6_2', PHP_INT_MAX );
