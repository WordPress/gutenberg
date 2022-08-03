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
	 * @since 6.1.0
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
	 * @param string $font_family The font family to register.
	 * @return bool Whether the font family has been registered. True on success, false on failure.
	 */
	function wp_register_font_family( $font_family ) {
		return wp_webfonts()->add( sanitize_title( $font_family ), false );
	}
}

if ( ! function_exists( 'wp_register_font_variation' ) ) {
	/**
	 * Registers a variation to the given font family.
	 *
	 * @since 6.1.0
	 *
	 * @param string $font_family_handle The font family's handle for this variation.
	 * @param array  $variation          An array of variation properties to add.
	 * @param string $variation_handle   Optional. The variation's handle. When none is provided, the
	 *                                   handle will be dynamically generated.
	 *                                   Default empty string.
	 * @return string|bool Variation handle on success. Else false.
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
	 * @return string[] The font family handle of the registered webfonts.
	 */
	function wp_register_webfonts( array $webfonts ) {
		$registered  = array();
		$wp_webfonts = wp_webfonts();

		foreach ( $webfonts as $font_family => $variations ) {
			// Skip if the font family is not defined as a key.
			if ( ! is_string( $font_family ) || empty( $font_family ) ) {
				continue;
			}

			$font_family_handle = sanitize_title( $font_family );
			$is_registered      = $wp_webfonts->add( $font_family_handle, false );
			if ( ! $is_registered ) {
				continue;
			}

			foreach ( $variations as $handle => $variation ) {
				$wp_webfonts->add_variation(
					$font_family_handle,
					$variation,
					is_string( $handle ) && '' !== $handle ? $handle : ''
				);
			}

			$registered[] = $font_family_handle;
		}

		return $registered;
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
	 *
	 * @param array $webfont Webfont to be registered.
	 * @return string|false The font family slug if successfully registered, else false.
	 */
	function wp_register_webfont( array $webfont ) {
		return wp_webfonts()->register_webfont( $webfont );
	}
}

if ( ! function_exists( 'wp_enqueue_webfont' ) ) {
	/**
	 * Enqueues one or more font family and all of its variations.
	 *
	 * @param string|string[] $font_family Font family handle (string) or handles (array of strings).
	 */
	function wp_enqueue_webfont( $font_family ) {
		wp_webfonts()->enqueue( $font_family );
	}
}

if ( ! function_exists( 'wp_enqueue_webfont_variations' ) ) {
	/**
	 * Enqueues a given set of web font variations.
	 *
	 * @TODO Is this needed?
	 *
	 * @param string[] $variations Font variations.
	 */
	function wp_enqueue_webfont_variations( $variations ) {
		$wp_webfonts = wp_webfonts();

		// Looking to enqueue all variations of a font family.
		foreach ( $variations as $variation ) {
			$wp_webfonts->enqueue( $variation );
		}
	}
}

if ( ! function_exists( 'wp_deregister_font_family' ) ) {
	/**
	 * Deregisters a font family and all registered variations.
	 *
	 * @since 6.1.0
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
	 * @since 6.1.0
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
	 * @since 6.0.0
	 *
	 * @return WP_Webfonts_Provider[] All registered providers, each keyed by their unique ID.
	 */
	function wp_get_webfont_providers() {
		return wp_webfonts()->get_providers();
	}
}

if ( ! function_exists( 'wp_print_webfonts' ) ) {
	/**
	 * Invokes each provider to process and print its styles.
	 *
	 * @since 6.1.0
	 *
	 * @param string|string[]|false $handles Optional. Items to be processed: queue (false),
	 *                                       single item (string), or multiple items (array of strings).
	 *                                       Default false.
	 * @return array|string[] Array of web font handles that have been processed.
	 *                        An empty array if none were processed.
	 */
	function wp_print_webfonts( $handles = false ) {
		global $wp_webfonts;

		/**
		 * Fires before webfonts in the $handles queue are printed.
		 *
		 * @since 6.1.0
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

add_action( 'admin_print_styles', 'wp_print_webfonts' );
add_action( 'wp_head', 'wp_print_webfonts' );

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
