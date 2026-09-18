<?php
/**
 * Font Providers: registration functions and `@font-face` output.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_register_font_provider' ) ) {
	/**
	 * Registers a font provider.
	 *
	 * @see WP_Font_Provider_Registry::register()
	 *
	 * @param string $slug Font provider slug.
	 * @param array  $args Font provider properties.
	 * @return bool True if the provider was registered, false otherwise.
	 */
	function wp_register_font_provider( $slug, $args ) {
		return WP_Font_Provider_Registry::get_instance()->register( $slug, $args );
	}
}

if ( ! function_exists( 'wp_unregister_font_provider' ) ) {
	/**
	 * Unregisters a font provider.
	 *
	 * @param string $slug Font provider slug.
	 * @return bool True if the provider was unregistered, false otherwise.
	 */
	function wp_unregister_font_provider( $slug ) {
		return WP_Font_Provider_Registry::get_instance()->unregister( $slug );
	}
}

/**
 * Prints the `@font-face` rules of registered font providers.
 *
 * Runs after wp_print_font_faces() on `wp_head`. It returns early when no provider
 * is registered: wp_print_font_faces() with an empty list would print the theme's
 * fonts a second time.
 */
function gutenberg_print_font_provider_font_faces() {
	$fonts = WP_Font_Provider_Registry::get_instance()->get_font_faces();

	if ( empty( $fonts ) ) {
		return;
	}

	wp_print_font_faces( $fonts );
}
add_action( 'wp_head', 'gutenberg_print_font_provider_font_faces', 50 );

/**
 * Adds the `@font-face` rules of registered font providers to the editor iframe.
 *
 * The iframe styles are collected in _wp_get_iframed_editor_assets(), which calls
 * wp_print_font_faces() without a hook for other fonts.
 *
 * @param array $settings Block editor settings.
 * @return array Filtered block editor settings.
 */
function gutenberg_add_font_provider_font_faces_to_editor( $settings ) {
	$fonts = WP_Font_Provider_Registry::get_instance()->get_font_faces();

	if ( empty( $fonts ) || ! isset( $settings['__unstableResolvedAssets']['styles'] ) ) {
		return $settings;
	}

	ob_start();
	wp_print_font_faces( $fonts );
	$settings['__unstableResolvedAssets']['styles'] .= ob_get_clean();

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_font_provider_font_faces_to_editor' );
