<?php
/**
 * Webfonts API functions.
 *
 * @package    WordPress
 * @subpackage WebFonts
 * @since      X.X.X
 */

if ( ! function_exists( 'wp_webfonts' ) ) {
	/**
	 * Initialize $wp_webfonts if it has not been set.
	 *
	 * @since X.X.X
	 *
	 * @global WP_Web_Fonts $wp_webfonts
	 *
	 * @return WP_Web_Fonts WP_Web_Fonts instance.
	 */
	function wp_webfonts() {
		global $wp_webfonts;

		if ( ! ( $wp_webfonts instanceof WP_Web_Fonts ) ) {
			$wp_webfonts = new WP_Web_Fonts();
			$wp_webfonts->register_provider( 'local', 'WP_Webfonts_Provider_Local' );
		}

		return $wp_webfonts;
	}
}

if ( ! function_exists( 'wp_register_webfonts' ) ) {
	/**
	 * Registers one or more font-families and each of their variations.
	 *
	 * @since X.X.X
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
		$registered  = array();
		$wp_webfonts = wp_webfonts();

		// BACKPORT NOTE: Do not backport this code block to Core.
		if ( $wp_webfonts->is_deprecated_structure( $webfonts ) ) {
			$webfonts = $wp_webfonts->migrate_deprecated_structure( $webfonts );
		}
		// BACKPORT NOTE: end of code block.

		foreach ( $webfonts as $font_family => $variations ) {
			$font_family_handle = $wp_webfonts->add_font_family( $font_family );
			if ( ! $font_family_handle ) {
				continue;
			}

			// Register each of the variations for this font family.
			foreach ( $variations as $variation_handle => $variation ) {
				if ( ! WP_Webfonts_Utils::is_defined( $variation_handle ) ) {
					$variation_handle = '';
				}

				$wp_webfonts->add_variation( $font_family_handle, $variation, $variation_handle );
			}

			$registered[] = $font_family_handle;
		}

		return $registered;
	}
}

if ( ! function_exists( 'wp_enqueue_webfonts' ) ) {
	/**
	 * Enqueues one or more font family and all of its variations.
	 *
	 * @since X.X.X
	 *
	 * @param string[] $font_families Font family(ies) to enqueue.
	 */
	function wp_enqueue_webfonts( array $font_families ) {
		$handles = array_map( array( WP_Webfonts_Utils::class, 'convert_font_family_into_handle' ), $font_families );

		wp_webfonts()->enqueue( $handles );
	}
}

if ( ! function_exists( 'wp_enqueue_webfont_variations' ) ) {
	/**
	 * Enqueues a specific set of web font variations.
	 *
	 * @since X.X.X
	 *
	 * @param string|string[] $variation_handles Variation handle (string) or handles (array of strings).
	 */
	function wp_enqueue_webfont_variations( $variation_handles ) {
		wp_webfonts()->enqueue( $variation_handles );
	}
}

if ( ! function_exists( 'wp_deregister_font_family' ) ) {
	/**
	 * Deregisters a font family and all of its registered variations.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family_handle The font family to remove.
	 */
	function wp_deregister_font_family( $font_family_handle ) {
		wp_webfonts()->remove_font_family( $font_family_handle );
	}
}

if ( ! function_exists( 'wp_deregister_webfont_variation' ) ) {
	/**
	 * Deregisters a font variation.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family_handle The font family for this variation.
	 * @param string $variation_handle   The variation's handle to remove.
	 */
	function wp_deregister_webfont_variation( $font_family_handle, $variation_handle ) {
		wp_webfonts()->remove_variation( $font_family_handle, $variation_handle );
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

if ( ! function_exists( 'wp_print_webfonts' ) ) {
	/**
	 * Invokes each provider to process and print its styles.
	 *
	 * @since X.X.X
	 *
	 * @param string|string[]|false $handles Optional. Items to be processed: queue (false),
	 *                                       single item (string), or multiple items (array of strings).
	 *                                       Default false.
	 * @return array|string[] Array of web font handles that have been processed.
	 *                        An empty array if none were processed.
	 */
	function wp_print_webfonts( $handles = false ) {
		global $wp_webfonts;

		if ( empty( $handles ) ) {
			$handles = false;
		}

		_wp_scripts_maybe_doing_it_wrong( __FUNCTION__ );

		if ( ! ( $wp_webfonts instanceof WP_Web_Fonts ) ) {
			if ( ! $handles ) {
				return array(); // No need to instantiate if nothing is there.
			}
		}

		return wp_webfonts()->do_items( $handles );
	}
}

add_action( 'admin_print_styles', 'wp_print_webfonts', 50 );
add_action( 'wp_head', 'wp_print_webfonts', 50 );

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
