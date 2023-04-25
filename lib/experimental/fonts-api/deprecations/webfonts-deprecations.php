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

if ( ! function_exists( 'wp_enqueue_webfonts' ) ) {
	/**
	 * Enqueues one or more font family and all of its variations.
	 *
	 * @since X.X.X
	 * @since GB 15.1 Use wp_enqueue_fonts() ihstead.
	 *
	 * @param string[] $font_families Font family(ies) to enqueue.
	 */
	function wp_enqueue_webfonts( array $font_families ) {
		_deprecated_function( __FUNCTION__, 'GB 15.1', 'wp_enqueue_fonts()' );

		wp_enqueue_fonts( $font_families );
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
	 * @deprecated GB 14.9.1 Use wp_enqueue_fonts() instead.
	 *
	 * @param string $font_family_name The font family name to be enqueued.
	 * @return bool True if successfully enqueued, else false.
	 */
	function wp_enqueue_webfont( $font_family_name ) {
		_deprecated_function( __FUNCTION__, 'GB 14.9.1', 'wp_enqueue_fonts()' );

		wp_enqueue_fonts( array( $font_family_name ) );
		return true;
	}
}

if ( ! function_exists( 'wp_enqueue_webfont_variations' ) ) {
	/**
	 * Enqueues a specific set of web font variations.
	 *
	 * @since X.X.X
	 * @deprecated GB 15.1 Use wp_enqueue_font_variations() instead.
	 *
	 * @param string|string[] $variation_handles Variation handle (string) or handles (array of strings).
	 */
	function wp_enqueue_webfont_variations( $variation_handles ) {
		_deprecated_function( __FUNCTION__, 'GB 15.1', 'wp_enqueue_font_variations()' );

		wp_enqueue_font_variations( $variation_handles );
	}
}

if ( ! function_exists( 'wp_deregister_webfont_variation' ) ) {
	/**
	 * Deregisters a font variation.
	 *
	 * @since GB 14.9.1
	 * @deprecated GB 15.1 Use wp_deregister_font_variation() instead.
	 *
	 * @param string $font_family_handle The font family for this variation.
	 * @param string $variation_handle   The variation's handle to remove.
	 */
	function wp_deregister_webfont_variation( $font_family_handle, $variation_handle ) {
		_deprecated_function( __FUNCTION__, 'GB 15.1', 'wp_deregister_font_variation()' );

		wp_deregister_font_variation( $font_family_handle, $variation_handle );
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

if ( ! function_exists( 'wp_register_webfont_provider' ) ) {
	/**
	 * Registers a custom font service provider.
	 *
	 * A webfont provider contains the business logic for how to
	 * interact with a remote font service and how to generate
	 * the `@font-face` styles for that remote service.
	 *
	 * How to register a custom font service provider:
	 *    1. Load its class file into memory before registration.
	 *    2. Pass the class' name to this function.
	 *
	 * For example, for a class named `My_Custom_Font_Service_Provider`:
	 * ```
	 *    wp_register_webfont_provider( My_Custom_Font_Service_Provider::class );
	 * ```
	 *
	 * @since X.X.X
	 * @deprecated GB 15.1 Use wp_register_font_provider() instead.
	 *
	 * @param string $name      The provider's name.
	 * @param string $classname The provider's class name.
	 *                          The class should be a child of `WP_Webfonts_Provider`.
	 *                          See {@see WP_Webfonts_Provider}.
	 *
	 * @return bool True if successfully registered, else false.
	 */
	function wp_register_webfont_provider( $name, $classname ) {
		_deprecated_function( __FUNCTION__, 'GB 15.1', 'wp_register_font_provider' );

		return wp_register_font_provider( $name, $classname );
	}
}

if ( ! function_exists( 'wp_print_webfonts' ) ) {
	/**
	 * Invokes each provider to process and print its styles.
	 *
	 * @since GB 14.9.1
	 * @deprecated GB 15.1 Use wp_print_fonts() instead.
	 *
	 * @param string|string[]|false $handles Optional. Items to be processed: queue (false),
	 *                                       single item (string), or multiple items (array of strings).
	 *                                       Default false.
	 * @return array|string[] Array of web font handles that have been processed.
	 *                        An empty array if none were processed.
	 */
	function wp_print_webfonts( $handles = false ) {
		return wp_print_fonts( $handles );
	}
}
