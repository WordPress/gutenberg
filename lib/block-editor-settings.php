<?php
/**
 * Adds settings to the block editor.
 *
 * @package gutenberg
 */

/**
 * Adds styles and __experimentalFeatures to the block editor settings.
 *
 * Note: The settings that are WP version specific should be handled inside the `compat` directory.
 *
 * @param array $settings Existing block editor settings.
 *
 * @return array New block editor settings.
 */
function gutenberg_get_block_editor_settings( $settings ) {
	// Copied from get_block_editor_settings() at wordpress-develop/block-editor.php.
	$settings['__experimentalFeatures'] = gutenberg_get_global_settings();

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_get_block_editor_settings', PHP_INT_MAX );
