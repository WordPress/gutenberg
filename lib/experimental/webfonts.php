<?php
/**
 * Webfonts API functions.
 *
 * @package    WordPress
 * @subpackage WebFonts
 * @since      6.0.0
 */

if ( ! function_exists( 'wp_webfonts' ) ) {
	/**
	 * Initialize $wp_webfonts if it has not been set.
	 *
	 * @since X.X.X
	 *
	 * @global WP_Webfonts $wp_webfonts
	 *
	 * @return WP_Webfonts WP_Webfonts instance.
	 */
	function wp_webfonts() {
		global $wp_webfonts;

		if ( ! ( $wp_webfonts instanceof WP_Webfonts ) ) {
			$wp_webfonts = new WP_Webfonts();
		}

		return $wp_webfonts;
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
		$wp_webfonts = wp_webfonts();

		return $wp_webfonts->add( sanitize_title( $font_family ), false );
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
		return wp_webfonts()->add_variation( $font_family, $variation_handle, $variation );
	}
}

if ( ! function_exists( 'wp_register_webfonts' ) ) {
	/**
	 * Registers a list of web fonts and variations.
	 *
	 * @param $webfonts
	 * @return array
	 */
	function wp_register_webfonts( $webfonts, $enqueue = false ) {
		$registered = array();

		foreach ( $webfonts as $font_family => $variations ) {
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
		$wp_webfonts = wp_webfonts();
		$wp_webfonts->enqueue( $handle );
	}
}

if ( ! function_exists( 'wp_enqueue_web_font_variations' ) ) {
	/**
	 * Enqueues a specific set of web font variations.
	 */
	function wp_enqueue_web_font_variations( $variations ) {
		$wp_webfonts = wp_webfonts();

		// Looking to enqueue all variations of a font family.
		foreach ( $variations as $variation ) {
			$wp_webfonts->enqueue( $variation );
		}
	}
}

if ( ! function_exists( 'wp_deregister_web_font_family' ) ) {
	/**
	 * Unregisters an entire font family and all variations.
	 */
	function wp_deregister_web_font_family( $font_family ) {
		wp_webfonts()->remove_family( $font_family );
	}
}

if ( ! function_exists( 'wp_deregister_web_font_variation' ) ) {
	/**
	 * @param $variation_handle
	 */
	function wp_deregister_web_font_variation( $font_family, $variation_handle ) {
		wp_webfonts()->remove_variation( $font_family, $variation_handle );
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

if ( ! function_exists( 'wp_print_webfonts' ) ) {
	function wp_print_webfonts( $handles = false ) {
		global $wp_webfonts;

		/**
		 * Fires before webfonts in the $handles queue are printed.
		 *
		 * @since X.X.X
		 */
		do_action( 'wp_print_webfonts' );

		if ( '' === $handles ) { // For 'wp_head'.
			$handles = false;
		}

		_wp_scripts_maybe_doing_it_wrong( __FUNCTION__ );

		if ( ! ( $wp_webfonts instanceof WP_Webfonts ) ) {
			if ( ! $handles ) {
				return array(); // No need to instantiate if nothing is there.
			}
		}

		return wp_webfonts()->do_items( $handles );
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
