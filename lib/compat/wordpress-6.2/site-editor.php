<?php
/**
 * Updates the site-editor.php file
 *
 * @package gutenberg
 */

/**
 * Remove home template setting for WP 6.2.
 *
 * @param array                   $settings Existing block editor settings.
 * @param WP_Block_Editor_Context $context The current block editor context.
 * @return array
 */
function gutenberg_site_editor_unset_homepage_setting( $settings, $context ) {
	if ( isset( $context->post ) ) {
		return $settings;
	}

	unset( $settings['__unstableHomeTemplate'] );

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_site_editor_unset_homepage_setting', 10, 2 );
