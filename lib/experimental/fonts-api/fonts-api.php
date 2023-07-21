<?php
/**
 * Fonts API functions.
 *
 * @package    WordPress
 * @subpackage Fonts API
 * @since      X.X.X
 */

if ( ! function_exists( 'wp_fonts' ) ) {
	/**
	 * Initialize $wp_fonts if it has not been set.
	 *
	 * @since X.X.X
	 *
	 * @global WP_Fonts $wp_fonts
	 *
	 * @return WP_Fonts WP_Fonts instance.
	 */
	function wp_fonts() {
		global $wp_fonts;

		if ( ! ( $wp_fonts instanceof WP_Fonts ) ) {
			$wp_fonts = new WP_Fonts();

			// Initialize.
			$wp_fonts->register_provider( 'local', 'WP_Fonts_Provider_Local' );
			add_action( 'wp_head', 'wp_print_fonts', 50 );
			add_action( 'admin_print_styles', 'wp_print_fonts', 50 );
		}

		return $wp_fonts;
	}
}

if ( ! function_exists( 'wp_register_fonts' ) ) {
	/**
	 * Registers one or more font-families and each of their variations.
	 *
	 * @since X.X.X
	 *
	 * @param array[] $fonts {
	 *     Fonts to be registered, grouped by each font-family.
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
	function wp_register_fonts( array $fonts ) {
		$registered = array();
		$wp_fonts   = wp_fonts();

		foreach ( $fonts as $font_family => $variations ) {
			$font_family_handle = $wp_fonts->add_font_family( $font_family );
			if ( ! $font_family_handle ) {
				continue;
			}

			// Register each of the variations for this font family.
			foreach ( $variations as $variation_handle => $variation ) {
				if ( ! WP_Fonts_Utils::is_defined( $variation_handle ) ) {
					$variation_handle = '';
				}

				$wp_fonts->add_variation( $font_family_handle, $variation, $variation_handle );
			}

			$registered[] = $font_family_handle;
		}

		return $registered;
	}
}

if ( ! function_exists( 'wp_enqueue_fonts' ) ) {
	/**
	 * Enqueues one or more font family and all of its variations.
	 *
	 * @since X.X.X
	 *
	 * @param string[] $font_families Font family(ies) to enqueue.
	 */
	function wp_enqueue_fonts( array $font_families ) {
		$handles = array_map( array( WP_Fonts_Utils::class, 'convert_font_family_into_handle' ), $font_families );

		wp_fonts()->enqueue( $handles );
	}
}

if ( ! function_exists( 'wp_enqueue_font_variations' ) ) {
	/**
	 * Enqueues a specific set of font variations.
	 *
	 * @since X.X.X
	 *
	 * @param string|string[] $variation_handles Variation handle (string) or handles (array of strings).
	 */
	function wp_enqueue_font_variations( $variation_handles ) {
		wp_fonts()->enqueue( $variation_handles );
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
		wp_fonts()->remove_font_family( $font_family_handle );
	}
}

if ( ! function_exists( 'wp_deregister_font_variation' ) ) {
	/**
	 * Deregisters a font variation.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family_handle The font family for this variation.
	 * @param string $variation_handle   The variation's handle to remove.
	 */
	function wp_deregister_font_variation( $font_family_handle, $variation_handle ) {
		wp_fonts()->remove_variation( $font_family_handle, $variation_handle );
	}
}

if ( ! function_exists( 'wp_register_font_provider' ) ) {
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
	 *    wp_register_font_provider( My_Custom_Font_Service_Provider::class );
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
	function wp_register_font_provider( $name, $classname ) {
		return wp_fonts()->register_provider( $name, $classname );
	}
}

if ( ! function_exists( 'wp_print_fonts' ) ) {
	/**
	 * Invokes each provider to process and print its styles.
	 *
	 * @since X.X.X
	 *
	 * @param string|string[]|bool $handles Optional. Items to be processed: queue (false),
	 *                                      for iframed editor assets (true), single item (string),
	 *                                      or multiple items (array of strings).
	 *                                      Default false.
	 * @return array|string[] Array of font handles that have been processed.
	 *                        An empty array if none were processed.
	 */
	function wp_print_fonts( $handles = false ) {
		$wp_fonts          = wp_fonts();
		$registered        = $wp_fonts->get_registered_font_families();
		$in_iframed_editor = true === $handles;

		// Nothing to print, as no fonts are registered.
		if ( empty( $registered ) ) {
			return array();
		}

		if ( empty( $handles ) ) {
			// Automatically enqueue all user-selected fonts.
			WP_Fonts_Resolver::enqueue_user_selected_fonts();
			$handles = false;
		} elseif ( $in_iframed_editor ) {
			// Print all registered fonts for the iframed editor.
			$queue           = $wp_fonts->queue;
			$done            = $wp_fonts->done;
			$wp_fonts->done  = array();
			$wp_fonts->queue = $registered;
			$handles         = false;
		}

		_wp_scripts_maybe_doing_it_wrong( __FUNCTION__ );

		$printed = $wp_fonts->do_items( $handles );

		// Reset the API.
		if ( $in_iframed_editor ) {
			$wp_fonts->done  = $done;
			$wp_fonts->queue = $queue;
		}

		return $printed;
	}
}

/**
 * Add webfonts mime types.
 */
add_filter(
	'mime_types',
	static function( $mime_types ) {
		// Webfonts formats.
		$mime_types['woff2'] = 'font/woff2';
		$mime_types['woff']  = 'font/woff';
		$mime_types['ttf']   = 'font/ttf';
		$mime_types['eot']   = 'application/vnd.ms-fontobject';
		$mime_types['otf']   = 'application/x-font-opentype';

		return $mime_types;
	}
);

/*
 * To make sure blocks are registered before any Theme_JSON operations take place, a priority of 21 is used.
 *
 * Why 21?
 * Blocks are registered via the "init" hook with a priority value of `20`, which is dynamically added
 * during the build. See: tools/webpack/blocks.js.
 */
add_action( 'init', 'WP_Fonts_Resolver::register_fonts_from_theme_json', 21 );

add_filter(
	'block_editor_settings_all',
	static function( $settings ) {
		ob_start();
		wp_print_fonts( true );
		$styles = ob_get_clean();

		// Add the font-face styles to iframed editor assets.
		$settings['__unstableResolvedAssets']['styles'] .= $styles;
		return $settings;
	},
	11
);
