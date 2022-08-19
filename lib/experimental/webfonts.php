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
	 * @global WP_Webfonts $wp_webfonts
	 *
	 * @return WP_Webfonts WP_Webfonts instance.
	 */
	function wp_webfonts() {
		global $wp_webfonts;

		if ( ! ( $wp_webfonts instanceof WP_Webfonts ) ) {
			$wp_webfonts = new WP_Webfonts();
			$wp_webfonts->register_provider( 'local', 'WP_Webfonts_Provider_Local' );
		}

		return $wp_webfonts;
	}
}

if ( ! function_exists( 'wp_register_font_family' ) ) {
	/**
	 * Registers a font family.
	 *
	 * @since 6.1.0
	 *
	 * @param string $font_family The font family's name or handle to register.
	 * @return string|null The font family handle when successfully registered. Else null.
	 */
	function wp_register_font_family( $font_family ) {
		$handle = WP_Webfonts_Utils::convert_font_family_into_handle( $font_family );
		if ( ! $handle ) {
			return null;
		}

		$result = wp_webfonts()->add( $handle, false ) ? $handle : null;
		return $result ? $handle : null;
	}
}

if ( ! function_exists( 'wp_register_webfont_variation' ) ) {
	/**
	 * Registers a variation to the given font family.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family_handle The font family's handle for this variation.
	 * @param array  $variation          An array of variation properties to add.
	 * @param string $variation_handle   Optional. The variation's handle. When none is provided, the
	 *                                   handle will be dynamically generated.
	 *                                   Default empty string.
	 * @return string|null Variation handle on success. Else null.
	 */
	function wp_register_webfont_variation( $font_family_handle, array $variation, $variation_handle = '' ) {
		return wp_webfonts()->add_variation( $font_family_handle, $variation, $variation_handle );
	}
}

if ( ! function_exists( 'wp_register_webfonts' ) ) {
	/**
	 * Registers a list of web fonts and variations.
	 *
	 * @since 6.1.0
	 *
	 * @param array[] $webfonts Web fonts to be registered.
	 * @return string[] The font family handle of the registered web fonts.
	 */
	function wp_register_webfonts( array $webfonts ) {
		$registered = array();

		foreach ( $webfonts as $font_family => $variations ) {
			/*
			 * Handle the deprecated web font's structure but alert developers
			 * to modify their web font structure to group and key by font family.
			 *
			 * Note: This code block will not be backported to Core.
			 */
			if ( ! WP_Webfonts_Utils::is_defined( $font_family ) ) {
				_doing_it_wrong(
					__FUNCTION__,
					__( 'Variations must be grouped and keyed by their font family.', 'gutenberg' ),
					'6.1.0'
				);
				$font_family_handle = wp_register_webfont( $variations );
				if ( ! $font_family_handle ) {
					continue;
				}
				$registered[ $font_family_handle ] = true;
				continue;
			} // end of code block for deprecated web fonts structure.

			$font_family_handle = wp_register_font_family( $font_family );
			if ( ! $font_family_handle ) {
				continue;
			}

			// Register each of the variations for this font family.
			foreach ( $variations as $handle => $variation ) {
				wp_register_webfont(
					$variation,
					$font_family_handle,
					WP_Webfonts_Utils::is_defined( $handle ) ? $handle : ''
				);
			}

			$registered[] = $font_family_handle;
		}

		return $registered;
	}
}

if ( ! function_exists( 'wp_register_webfont' ) ) {
	/**
	 * Registers a single web font.
	 *
	 * @since X.X.X
	 *
	 * @param array  $variation          Array of variation properties to be registered.
	 * @param string $font_family_handle Optional. Font family handle for the given variation.
	 *                                   Default empty string.
	 * @param string $variation_handle   Optional. Handle for the variation to register.
	 * @return string|null The font family slug if successfully registered. Else null.
	 */
	function wp_register_webfont( array $variation, $font_family_handle = '', $variation_handle = '' ) {
		// When font family's handle is not passed, attempt to get it from the variation.
		if ( ! WP_Webfonts_Utils::is_defined( $font_family_handle ) ) {
			$font_family = WP_Webfonts_Utils::get_font_family_from_variation( $variation );
			if ( $font_family ) {
				$font_family_handle = WP_Webfonts_Utils::convert_font_family_into_handle( $font_family );
			}
		}

		if ( empty( $font_family_handle ) ) {
			trigger_error( 'Font family handle must be a non-empty string.' );
			return null;
		}

		return wp_webfonts()->add_variation( $font_family_handle, $variation, $variation_handle )
			? $font_family_handle
			: null;
	}
}

if ( ! function_exists( 'wp_enqueue_webfont' ) ) {
	/**
	 * Enqueues one or more font family and all of its variations.
	 *
	 * @since X.X.X
	 *
	 * @param string|string[] $font_family Font family handle (string) or handles (array of strings).
	 */
	function wp_enqueue_webfont( $font_family ) {
		wp_webfonts()->enqueue( $font_family );
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
