<?php
/**
 * Webfonts API functions.
 *
 * @package    WordPress
 * @subpackage WebFonts
 * @since      6.0.0
 */

if ( ! function_exists( 'wp_web_fonts' ) ) {
	/**
	 * Initialize $wp_web_fonts if it has not been set.
	 *
	 * @since X.X.X
	 *
	 * @global WP_Web_Fonts $wp_web_fonts
	 *
	 * @return WP_Web_Fonts WP_Web_Fonts instance.
	 */
	function wp_web_fonts() {
		global $wp_web_fonts;

		if ( ! ( $wp_web_fonts instanceof WP_Web_Fonts ) ) {
			$wp_web_fonts = new WP_Web_Fonts();
		}

		return $wp_web_fonts;
	}
}

if ( ! function_exists( 'wp_register_web_font_family' ) ) {
	/**
	 * Registers a font family as an alias.
	 *
	 * @param $font_family
	 * @return array|bool
	 */
	function wp_register_web_font_family( $font_family ) {
		$wp_web_fonts = wp_web_fonts();

		return $wp_web_fonts->add( $font_family, false );
	}
}

if ( ! function_exists( 'wp_register_web_font_variation' ) ) {
	/**
	 * Registers a font variation.
	 *
	 * @param $font_family
	 * @return mixed
	 */
	function wp_register_web_font_variation( $font_family, $variation_handle, $variation ) {
		return wp_web_fonts()->add_variation( $font_family, $variation_handle, $variation );
	}
}

if ( ! function_exists( 'wp_register_web_fonts' ) ) {
	/**
	 * Registers a list of web fonts and variations.
	 *
	 * @param $web_fonts
	 * @return array
	 */
	function wp_register_web_fonts( $web_fonts, $enqueue = false ) {
		$registered = array();

		foreach ( $web_fonts as $font_family => $variations ) {
			wp_register_web_font_family( $font_family );

			foreach ( $variations as $variation_handle => $variation ) {
				$registered[] = wp_register_web_font_variation( $font_family, $variation_handle, $variation );

				if ( $enqueue ) {
					wp_enqueue_web_font( $variation_handle );
				}
			}
		}

		return $registered;
	}
}

if ( ! function_exists( 'wp_enqueue_web_font' ) ) {
	/**
	 * Enqueues a web font family and all variations.
	 */
	function wp_enqueue_web_font( $handle ) {
		$wp_web_fonts = wp_web_fonts();
		$wp_web_fonts->enqueue( $handle );
	}
}

if ( ! function_exists( 'wp_enqueue_web_font_variations' ) ) {
	/**
	 * Enqueues a specific set of web font variations.
	 */
	function wp_enqueue_web_font_variations( $variations ) {
		$wp_web_fonts = wp_web_fonts();

		// Looking to enqueue all variations of a font family.
		foreach ( $variations as $variation ) {
			$wp_web_fonts->enqueue( $variation );
		}
	}
}

if ( ! function_exists( 'wp_deregister_web_font_family' ) ) {
	/**
	 * Unregisters an entire font family and all vcariations.
	 */
	function wp_deregister_web_font_family( $font_family ) {
		wp_web_fonts()->remove_family( $font_family );
	}
}

if ( ! function_exists( 'wp_deregister_web_font_variation' ) ) {
	/**
	 * @param $variation_handle
	 */
	function wp_deregister_web_font_variation( $font_family, $variation_handle ) {
		wp_web_fonts()->remove_variation( $font_family, $variation_handle );
	}
}













/** Unaltered so far. */




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
	 * @since 6.0.0
	 *
	 * @param string $name      The provider's name.
	 * @param string $classname The provider's class name.
	 *                          The class should be a child of `WP_Webfonts_Provider`.
	 *                          See {@see WP_Webfonts_Provider}.
	 *
	 * @return bool True if successfully registered, else false.
	 */
	function wp_register_webfont_provider( $name, $classname ) {
		return wp_webfonts()->register_provider( $name, $classname );
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
	 * @since 6.0.0
	 *
	 * @return WP_Webfonts_Provider[] All registered providers, each keyed by their unique ID.
	 */
	function wp_get_webfont_providers() {
		return wp_webfonts()->get_providers();
	}
}

/**
 * Add webfonts mime types.
 */
add_filter(
	'mime_types',
	function( $mime_types ) {
		// Webfonts formats.
		$mime_types['woff2'] = 'font/woff2';
		$mime_types['woff']  = 'font/woff';
		$mime_types['ttf']   = 'font/ttf';
		$mime_types['eot']   = 'application/vnd.ms-fontobject';
		$mime_types['otf']   = 'application/x-font-opentype';

		return $mime_types;
	}
);
