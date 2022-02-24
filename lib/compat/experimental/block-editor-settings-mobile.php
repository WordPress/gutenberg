<?php
/**
 * Adds settings to the mobile block editor.
 *
 * @package gutenberg
 */

/**
 * Adds settings to the mobile block editor.
 *
 * @param array $settings Existing block editor settings.
 *
 * @return array New block editor settings.
 */
function gutenberg_get_block_editor_settings_mobile( $settings ) {
	if (
		defined( 'REST_REQUEST' ) &&
		REST_REQUEST &&
		isset( $_GET['context'] ) &&
		'mobile' === $_GET['context']
	) {
		$settings['__experimentalStyles'] = gutenberg_get_global_styles();
	}

	return $settings;
}

add_filter( 'block_editor_settings_all', 'gutenberg_get_block_editor_settings_mobile', PHP_INT_MAX );
