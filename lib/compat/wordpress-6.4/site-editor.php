<?php
/**
 * Updates the site-editor.php file
 *
 * @package gutenberg
 */

/**
 * Enqueue codemirror CSS editor for WP 6.4.
 *
 * @param array                   $settings Existing block editor settings.
 * @param WP_Block_Editor_Context $context The current block editor context.
 * @return array
 */
function gutenberg_site_editor_enqueue_code_mirror( $settings, $context ) {
	if ( isset( $context->post ) ) {
		return $settings;
	}

	wp_enqueue_code_editor(array( 'type' => 'text/css'));

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_site_editor_enqueue_code_mirror', 10, 2 );
