<?php
/**
 * Fonts functions.
 *
 * @package    WordPress
 * @subpackage Fonts
 * @since      X.X.X
 */

add_action( 'wp_head', 'wp_print_font_faces', 50 );
add_action( 'admin_print_styles', 'wp_print_font_faces', 50 );

if ( ! function_exists( 'wp_print_font_faces' ) ) {
	/**
	 * Generates and prints font-face styles for given fonts or theme.json fonts.
	 *
	 * @since X.X.X
	 *
	 * @param array $fonts Optional. The fonts to generate and print @font-face styles.
	 *                     Default empty array.
	 */
	function wp_print_font_faces( array $fonts = array() ) {
		static $wp_font_face = null;

		if ( empty( $fonts ) ) {
			$fonts = WP_Font_Face_Resolver::get_fonts_from_theme_json();
		}

		if ( empty( $fonts ) ) {
			return;
		}

		if (
			null !== $wp_font_face &&

			/*
			 * Ignore static cache when `WP_DEBUG` is enabled. Why? To avoid interfering with
			 * the theme developer's workflow.
			 *
			 * @todo Replace `WP_DEBUG` once an "in development mode" check is available in Core.
			 */
			! WP_DEBUG &&

			/*
			 * Ignore cache when automated test suites are running. Why? To ensure
			 * the static cache is reset between each test.
			 */
			! ( defined( 'WP_RUN_CORE_TESTS' ) && WP_RUN_CORE_TESTS )
		) {
			return $wp_font_face;
		}

		$wp_font_face = new WP_Font_Face();

		wp_font_face()->generate_and_print( $fonts );
	}
}
