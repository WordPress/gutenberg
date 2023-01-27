<?php
/**
 * Bootstraps Global Styles.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'gutenberg_register_fonts_from_theme_json' ) ) {
	/**
	 * Register fonts defined in theme.json.
	 */
	function gutenberg_register_fonts_from_theme_json() {
		// Get settings.
		$settings = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data()->get_settings();

		// If in the editor, add webfonts defined in variations.
		if ( is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			$variations = WP_Theme_JSON_Resolver_Gutenberg::get_style_variations();

			foreach ( $variations as $variation ) {

				// Sanity check: Skip if fontFamilies are not defined in the variation.
				if (
					empty( $variation['settings'] ) ||
					empty( $variation['settings']['typography'] ) ||
					empty( $variation['settings']['typography']['fontFamilies'] )
				) {
					continue;
				}

				// Merge the variation settings with the global settings.
				$settings['typography']                          = empty( $settings['typography'] ) ? array() : $settings['typography'];
				$settings['typography']['fontFamilies']          = empty( $settings['typography']['fontFamilies'] ) ? array() : $settings['typography']['fontFamilies'];
				$settings['typography']['fontFamilies']['theme'] = empty( $settings['typography']['fontFamilies'] ) ? array() : $settings['typography']['fontFamilies']['theme'];
				$settings['typography']['fontFamilies']['theme'] = array_merge( $settings['typography']['fontFamilies']['theme'], $variation['settings']['typography']['fontFamilies']['theme'] );

				// Make sure there are no duplicates.
				$settings['typography']['fontFamilies'] = array_unique( $settings['typography']['fontFamilies'] );
			}
		}

		// Bail out early if there are no settings for webfonts.
		if ( empty( $settings['typography'] ) || empty( $settings['typography']['fontFamilies'] ) ) {
			return;
		}

		$fonts   = array();
		$handles = array();

		// Look for fontFamilies.
		foreach ( $settings['typography']['fontFamilies'] as $font_families ) {
			foreach ( $font_families as $font_family ) {

				// Skip if fontFace is not defined.
				if ( empty( $font_family['fontFace'] ) ) {
					continue;
				}

				$font_family['fontFace'] = (array) $font_family['fontFace'];

				foreach ( $font_family['fontFace'] as $font_face ) {
					// Skip if the webfont was registered through the Webfonts API.
					if ( isset( $font_face['origin'] ) && 'gutenberg_wp_webfonts_api' === $font_face['origin'] ) {
						continue;
					}

					// Check if webfonts have a "src" param, and if they do account for the use of "file:./".
					if ( ! empty( $font_face['src'] ) ) {
						$font_face['src'] = (array) $font_face['src'];

						foreach ( $font_face['src'] as $src_key => $url ) {
							// Tweak the URL to be relative to the theme root.
							if ( ! str_starts_with( $url, 'file:./' ) ) {
								continue;
							}
							$font_face['src'][ $src_key ] = get_theme_file_uri( str_replace( 'file:./', '', $url ) );
						}
					}

					// Convert keys to kebab-case.
					foreach ( $font_face as $property => $value ) {
						$kebab_case               = _wp_to_kebab_case( $property );
						$font_face[ $kebab_case ] = $value;
						if ( $kebab_case !== $property ) {
							unset( $font_face[ $property ] );
						}
					}

					$font_family_handle = WP_Fonts_Utils::get_font_family_from_variation( $font_face );
					if ( empty( $font_family_handle ) && isset( $font_family['slug'] ) ) {
						$font_family_handle = $font_family['slug'];
					}
					if ( ! empty( $font_family_handle ) ) {
						$font_family_handle = WP_Fonts_Utils::convert_font_family_into_handle( $font_family_handle );
					}
					if ( empty( $font_family_handle ) ) {
						_doing_it_wrong( __FUNCTION__, __( 'Font family not defined in the variation or "slug".', 'gutenberg' ), '6.1.0' );
					}

					$handles[] = $font_family_handle;
					if ( ! array_key_exists( $font_family_handle, $fonts ) ) {
						$fonts[ $font_family_handle ] = array();
					}

					$fonts[ $font_family_handle ][] = $font_face;
				}
			}
		}

		wp_register_fonts( $fonts );
		wp_enqueue_fonts( $handles );
	}
}

if ( ! function_exists( 'gutenberg_add_registered_fonts_to_theme_json' ) ) {
	/**
	 * Add missing fonts data to the global styles.
	 *
	 * @param array $data The global styles.
	 * @return array The global styles with missing fonts data.
	 */
	function gutenberg_add_registered_fonts_to_theme_json( $data ) {
		$font_families_registered = wp_fonts()->get_registered_font_families();

		$raw_data = $data->get_raw_data();

		$font_families_from_theme = ! empty( $raw_data['settings']['typography']['fontFamilies']['theme'] )
			? $raw_data['settings']['typography']['fontFamilies']['theme']
			: array();

		/**
		 * Helper to get an array of the font-families.
		 *
		 * @param array $families_data The font-families data.
		 * @return array The font-families array.
		 */
		$get_families = static function ( $families_data ) {
			$families = array();
			foreach ( $families_data as $family ) {
				$font_family = WP_Fonts_Utils::get_font_family_from_variation( $family );
				$handle      = WP_Fonts_Utils::convert_font_family_into_handle( $font_family );
				if ( ! empty( $handle ) ) {
					$families[ $handle ] = true;
				}
			}

			return ! empty( $families ) ? array_keys( $families ) : array();
		};

		// Find missing fonts that are not in the theme's theme.json.
		$to_add = array();
		if ( ! empty( $font_families_registered ) ) {
			$to_add = array_diff( $font_families_registered, $get_families( $font_families_from_theme ) );
		}

		// Bail out early if there are no missing fonts.
		if ( empty( $to_add ) ) {
			return $data;
		}

		// Make sure the path to settings.typography.fontFamilies.theme exists
		// before adding missing fonts.
		if ( empty( $raw_data['settings'] ) ) {
			$raw_data['settings'] = array();
		}
		if ( empty( $raw_data['settings']['typography'] ) ) {
			$raw_data['settings']['typography'] = array();
		}
		if ( empty( $raw_data['settings']['typography']['fontFamilies'] ) ) {
			$raw_data['settings']['typography']['fontFamilies'] = array();
		}
		if ( empty( $raw_data['settings']['typography']['fontFamilies'] ) ) {
			$raw_data['settings']['typography']['fontFamilies']['theme'] = array();
		}

		foreach ( $to_add as $font_family_handle ) {
			$raw_data['settings']['typography']['fontFamilies']['theme'][] = wp_fonts()->to_theme_json( $font_family_handle );
		}

		return new WP_Theme_JSON_Gutenberg( $raw_data );
	}
}

// `gutenberg_register_fonts_from_theme_json()` calls `WP_Theme_JSON_Resolver_Gutenberg::get_merged_data()`, which instantiates `WP_Theme_JSON_Gutenberg()`;
// Gutenberg server-side blocks are registered via the init hook with a priority value of `20`. E.g., `add_action( 'init', 'register_block_core_image', 20 )`;
// This priority value is added dynamically during the build. See: tools/webpack/blocks.js.
// We want to make sure Gutenberg blocks are re-registered before any Theme_JSON operations take place
// so that we have access to updated merged data.
add_action( 'init', 'gutenberg_register_fonts_from_theme_json', 21 );
