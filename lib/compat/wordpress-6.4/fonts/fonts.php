<?php
/**
 * Fonts functions.
 *
 * @package    WordPress
 * @subpackage Fonts
 * @since      6.4.0
 */

if ( ! function_exists( 'wp_print_font_faces' ) ) {
	// @core-merge: will merge into Core's `wp-includes/default-filters.php` file.
	add_action( 'wp_head', 'wp_print_font_faces', 50 );
	// @core-merge: will merge into Core's `wp-admin/includes/admin-filters.php.` file.
	add_action( 'admin_print_styles', 'wp_print_font_faces', 50 );

	/**
	 * Generates and prints font-face styles for given fonts or theme.json fonts.
	 *
	 * @since 6.4.0
	 *
	 * @param array $fonts Optional. The fonts to generate and print @font-face styles.
	 *                     Default empty array.
	 */
	function wp_print_font_faces( $fonts = array() ) {

		if ( empty( $fonts ) ) {
			$fonts = WP_Font_Face_Resolver::get_fonts_from_theme_json();
		}

		if ( empty( $fonts ) ) {
			return;
		}

		$wp_font_face = new WP_Font_Face();
		$wp_font_face->generate_and_print( $fonts );
	}

	// @core-merge: do not merge this code into Core.
	add_filter(
		'block_editor_settings_all',
		static function( $settings ) {
			ob_start();
			// @core-merge: add only this line into Core's `_wp_get_iframed_editor_assets()` function after `wp_print_styles()`.
			wp_print_font_faces();
			$styles = ob_get_clean();

			// Add the font-face styles to iframed editor assets.
			$settings['__unstableResolvedAssets']['styles'] .= $styles;
			return $settings;
		},
		11
	);
}
