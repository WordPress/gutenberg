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

if ( ! function_exists( 'wp_enqueue_webfont' ) ) {
	/**
	 * Enqueue a single font family that has been registered beforehand.
	 *
	 * Example of how to enqueue Source Serif Pro font:
	 *
	 * <code>
	 * wp_enqueue_webfont( 'Source Serif Pro' );
	 * </code>
	 *
	 * Font families should be enqueued from the `init` hook or later.
	 *
	 * @since 6.0.0
	 * @deprecated X.X.X Use wp_enqueue_webfonts().
	 *
	 * @param string $font_family_name The font family name to be enqueued.
	 * @return bool True if successfully enqueued, else false.
	 */
	function wp_enqueue_webfont( $font_family_name ) {
		_deprecated_function( __FUNCTION__, 'X.X.X', 'wp_enqueue_webfonts()' );

		wp_enqueue_webfonts( array( $font_family_name ) );
		return true;
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
	 * @deprecated X.X.X Use wp_register_webfonts().
	 *
	 * @param array $webfont Webfont to be registered.
	 * @return string|false The font family slug if successfully registered, else false.
	 */
	function wp_register_webfont( array $webfont ) {
		_deprecated_function( __FUNCTION__, 'X.X.X', 'wp_register_webfonts()' );

		return wp_webfonts()->register_webfont( $webfont, '', '', false );
	}
}

if ( ! function_exists( 'wp_get_webfont_providers' ) ) {
	/**
	 * Gets all registered providers.
	 *
	 * Return an array of providers, each keyed by their unique
	 * ID (i.e. the `$id` property in the provider's object) with
	 * an instance of the provider (object):
	 *     ID => provider instance
	 *
	 * Each provider contains the business logic for how to
	 * process its specific font service (i.e. local or remote)
	 * and how to generate the `@font-face` styles for its service.
	 *
	 * @since X.X.X
	 * @deprecated X.X.X Use wp_webfonts()->get_providers().
	 *
	 * @return string[] All registered providers, each keyed by their unique ID.
	 */
	function wp_get_webfont_providers() {
		_deprecated_function( __FUNCTION__, 'X.X.X', 'wp_webfonts()->get_providers()' );

		$providers = array();
		foreach ( wp_webfonts()->get_providers() as $id => $config ) {
			$providers[ $id ] = $config['class'];
		}

		return $providers;
	}
}
