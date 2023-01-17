<?php
/**
 * Deprecated functions provided here to give extenders time to change
 * their plugins/themes before this API is introduced into Core.
 *
 * BACKPORT NOTE: Do not backport these deprecated functions to Core.
 *
 * @package    WordPress
 * @subpackage Fonts API
 * @since      X.X.X
 */

if ( ! function_exists( 'wp_webfonts' ) ) {
	/**
	 * Initialize $wp_webfonts if it has not been set.
	 *
	 * @since X.X.X
	 * @deprecated GB 15.1 Use wp_fonts() instead.
	 *
	 * @global WP_Web_Fonts $wp_webfonts
	 *
	 * @return WP_Web_Fonts WP_Web_Fonts instance.
	 */
	function wp_webfonts() {
		_deprecated_function( __FUNCTION__, 'GB 15.1', 'wp_fonts()' );

		global $wp_webfonts;

		$wp_webfonts = wp_fonts();

		return $wp_webfonts;
	}
}

if ( ! function_exists( 'wp_register_webfonts' ) ) {
	/**
	 * Registers one or more font-families and each of their variations.
	 *
	 * @since X.X.X
	 * @deprecated GB 15.1 Use wp_register_fonts() instead.
	 *
	 * @param array[] $webfonts {
	 *     Web fonts to be registered, grouped by each font-family.
	 *
	 *     @type string $font-family => array[] $variations {
	 *          An array of web font variations for this font-family.
	 *          Each variation has the following structure.
	 *
	 *          @type array $variation {
	 *              @type string $provider     The provider ID. Default 'local'.
	 *              @type string $font-style   The font-style property. Default 'normal'.
	 *              @type string $font-weight  The font-weight property. Default '400'.
	 *              @type string $font-display The font-display property. Default 'fallback'.
	 *         }
	 *     }
	 * }
	 * @return string[] Array of registered font family handles.
	 */
	function wp_register_webfonts( array $webfonts ) {
		_deprecated_function( __FUNCTION__, 'GB 15.1', 'wp_register_fonts()' );

		return wp_register_fonts( $webfonts );
	}
}

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
	 * @deprecated 14.9.1 Use wp_register_fonts().
	 *
	 * @param array $webfont Webfont to be registered.
	 * @return string|false The font family slug if successfully registered, else false.
	 */
	function wp_register_webfont( array $webfont ) {
		_deprecated_function( __FUNCTION__, '14.9.1', 'wp_register_fonts()' );

		return wp_fonts()->register_webfont( $webfont, '', '', false );
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
	 * @deprecated GB 14.9.1 Use wp_fonts()->get_providers().
	 *
	 * @return string[] All registered providers, each keyed by their unique ID.
	 */
	function wp_get_webfont_providers() {
		_deprecated_function( __FUNCTION__, '14.9.1', 'wp_fonts()->get_providers()' );

		$providers = array();
		foreach ( wp_fonts()->get_providers() as $id => $config ) {
			$providers[ $id ] = $config['class'];
		}

		return $providers;
	}
}
