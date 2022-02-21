<?php
/**
 * Loads the CSS Custom Properties in use by Global Styles.
 *
 * @package Gutenberg
 */

// This has been ported as part of default-filters.php.
if ( ! function_exists( 'wp_enqueue_global_styles_css_custom_properties' ) ) {
	/**
	 * Function to enqueue the CSS Custom Properties
	 * coming from theme.json.
	 */
	function wp_enqueue_global_styles_css_custom_properties() {
		wp_register_style( 'global-styles-css-custom-properties', false, array(), true, true );
		wp_add_inline_style( 'global-styles-css-custom-properties', gutenberg_get_global_stylesheet( array( 'variables' ) ) );
		wp_enqueue_style( 'global-styles-css-custom-properties' );
	}
	add_filter( 'enqueue_block_editor_assets', 'wp_enqueue_global_styles_css_custom_properties' );
}
