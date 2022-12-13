<?php
/**
 * Deprecated functions provided here to give extenders time to change
 * their plugins/themes before this API is introduced into Core.
 *
 * BACKPORT NOTE: Do not backport these deprecated functions to Core.
 *
 * @since      X.X.X
 * @subpackage WebFonts
 * @package    WordPress
 */

if ( ! function_exists( 'wp_enqueue_webfonts' ) ) {
	/**
	 * Enqueues a collection of font families.
	 *
	 * Example of how to enqueue Source Serif Pro and Roboto font families, both registered beforehand.
	 *
	 * <code>
	 * wp_enqueue_webfonts(
	 *  'Roboto',
	 *  'Sans Serif Pro'
	 * );
	 * </code>
	 *
	 * Font families should be enqueued from the `init` hook or later.
	 *
	 * BACKPORT NOTE: Do not backport this function.
	 *
	 * @since 6.0.0
	 * @deprecated X.X.X Use wp_enqueue_webfont().
	 *
	 * @param string[] $font_families Font family handles (array of strings).
	 */
	function wp_enqueue_webfonts( array $font_families ) {
		_deprecated_function( __FUNCTION__, 'X.X.X', 'wp_enqueue_webfont()' );

		wp_enqueue_webfont( $font_families );
	}
}

if ( ! function_exists( 'wp_register_webfont' ) ) {
	/**
	 * Registers a single webfont.
	 *
	 * Example of how to register Source Serif Pro font with font-weight range of 200-900:
	 *
	 * If the font file is contained within the theme:
	 *
	 * <code>
	 * wp_register_webfont(
	 *      array(
	 *          'provider'    => 'local',
	 *          'font-family' => 'Source Serif Pro',
	 *          'font-weight' => '200 900',
	 *          'font-style'  => 'normal',
	 *          'src'         => get_theme_file_uri( 'assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2' ),
	 *      )
	 * );
	 * </code>
	 *
	 * @since 6.0.0
	 * @deprecated X.X.X Use wp_enqueue_webfont().
	 *
	 * @param array $webfont Webfont to be registered.
	 * @return string|false The font family slug if successfully registered, else false.
	 */
	function wp_register_webfont( array $webfont ) {
		_deprecated_function( __FUNCTION__, 'X.X.X', 'wp_register_webfont_variation()' );

		return wp_webfonts()->register_webfont( $webfont );
	}
}
