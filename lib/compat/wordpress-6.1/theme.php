<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 6.1.0 becomes the lowest
 * supported version by this plugin.
 *
 * @package gutenberg
 */

/**
 * This function runs in addition to the core `create_initial_theme_features`.
 * The 6.1 release needs to update the core function to include the body of this function.
 *
 * Creates the initial theme features when the 'setup_theme' action is fired.
 *
 * See {@see 'setup_theme'}.
 *
 * @since 5.5.0
 * @since 6.0.1 The `block-templates` feature was added.
 * @since 6.1.0 The `disable-layout-styles` feature was added.
 */
function gutenberg_create_initial_theme_features() {
	register_theme_feature(
		'disable-layout-styles',
		array(
			'description'  => __( 'Whether the theme disables generated layout styles.', 'gutenberg' ),
			'show_in_rest' => true,
		)
	);
}
add_action( 'setup_theme', 'gutenberg_create_initial_theme_features', 0 );

if ( ! function_exists( 'wp_theme_get_element_class_name' ) ) {
	/**
	 * Given an element name, returns a class name.
	 * Alias from WP_Theme_JSON_Gutenberg::get_element_class_name.
	 *
	 * @param string $element The name of the element.
	 *
	 * @return string The name of the class.
	 *
	 * @since 6.1.0
	 */
	function wp_theme_get_element_class_name( $element ) {
		return WP_Theme_JSON_Gutenberg::get_element_class_name( $element );
	}
}
