<?php
/**
 * WP_Fonts_Resolver class.
 *
 * @package    WordPress
 * @subpackage Fonts API
 * @since      X.X.X
 */

if ( class_exists( 'WP_Fonts_Resolver' ) ) {
	return;
}

/**
 * The Fonts API Resolver abstracts the processing of different data sources
 * (such as theme.json and global styles) for font interactions with the API.
 *
 * This class is for internal core usage and is not supposed to be used by
 * extenders (plugins and/or themes).
 *
 * @access private
 */
class WP_Fonts_Resolver {
	/**
	 * Defines the key structure in global styles to the fontFamily
	 * user-selected font.
	 *
	 * @since X.X.X
	 *
	 * @var string[][]
	 */
	protected static $global_styles_font_family_structure = array(
		array( 'elements', 'link', 'typography', 'fontFamily' ),
		array( 'elements', 'heading', 'typography', 'fontFamily' ),
		array( 'elements', 'caption', 'typography', 'fontFamily' ),
		array( 'elements', 'button', 'typography', 'fontFamily' ),
		array( 'typography', 'fontFamily' ),
	);

	/**
	 * Enqueues user-selected fonts via global styles.
	 *
	 * @since X.X.X
	 *
	 * @return array User selected font-families when exists, else empty array.
	 */
	public static function enqueue_user_selected_fonts() {
		$user_selected_fonts = array();
		$user_global_styles  = WP_Theme_JSON_Resolver_Gutenberg::get_user_data()->get_raw_data();
		if ( isset( $user_global_styles['styles'] ) ) {
			$user_selected_fonts = static::get_user_selected_fonts( $user_global_styles['styles'] );
		}

		if ( empty( $user_selected_fonts ) ) {
			return array();
		}

		wp_enqueue_fonts( $user_selected_fonts );
		return $user_selected_fonts;
	}

	/**
	 * Gets the user-selected font-family handles.
	 *
	 * @since X.X.X
	 *
	 * @param  array $global_styles Global styles potentially containing user-selected fonts.
	 * @return array User-selected font-families.
	 */
	private static function get_user_selected_fonts( array $global_styles ) {
		$font_families = array();

		foreach ( static::$global_styles_font_family_structure as $path ) {
			$style_value = _wp_array_get( $global_styles, $path, '' );

			$font_family = static::get_value_from_style( $style_value );
			if ( '' !== $font_family ) {
				$font_families[] = $font_family;
			}
		}

		return array_unique( $font_families );
	}

	/**
	 * Get the value (i.e. preset slug) from the given style value.
	 *
	 * @since X.X.X
	 *
	 * @param string $style       The style to parse.
	 * @param string $preset_type Optional. The type to parse. Default 'font-family'.
	 * @return string Preset slug.
	 */
	private static function get_value_from_style( $style, $preset_type = 'font-family' ) {
		if ( '' === $style ) {
			return '';
		}

		$starting_pattern = "var(--wp--preset--{$preset_type}--";
		$ending_pattern   = ')';
		if ( ! str_starts_with( $style, $starting_pattern ) ) {
			return '';
		}

		$offset = strlen( $starting_pattern );
		$length = strpos( $style, $ending_pattern ) - $offset;
		return substr( $style, $offset, $length );
	}

	/**
	 * Register fonts defined in theme.json.
	 */
	public static function register_fonts_from_theme_json() {

		$settings = static::get_settings();
		// Bail out early if there are no settings for webfonts.
		if ( empty( $settings['typography'] ) || empty( $settings['typography']['fontFamilies'] ) ) {
			return;
		}

		list( $fonts, $handles ) = static::parse_font_families( $settings );

		wp_register_fonts( $fonts );
		wp_enqueue_fonts( $handles );
	}

	/**
	 * Add missing fonts to the global styles.
	 *
	 * @param WP_Theme_JSON_Gutenberg|WP_Theme_JSON $data The global styles.
	 * @return WP_Theme_JSON_Gutenberg|WP_Theme_JSON The global styles with missing fonts.
	 */
	public static function add_missing_fonts_to_theme_json( $data ) {
		$font_families_registered = wp_fonts()->get_registered_font_families();

		$raw_data = $data->get_raw_data();

		$font_families_from_theme = ! empty( $raw_data['settings']['typography']['fontFamilies']['theme'] )
			? $raw_data['settings']['typography']['fontFamilies']['theme']
			: array();

		// Find missing fonts that are not in the theme's theme.json.
		$to_add = array();
		if ( ! empty( $font_families_registered ) ) {
			$to_add = array_diff( $font_families_registered, static::get_font_families( $font_families_from_theme ) );
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

	/**
	 * Returns theme's settings and adds webfonts defined in variations.
	 *
	 * @return array An array containing theme's settings.
	 */
	private static function get_settings() {
		// Get settings.
		$settings = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data()->get_settings();

		if ( ! is_admin() && ! ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			return $settings;
		}

		// If in the editor, add webfonts defined in variations.
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

		return $settings;
	}

	/**
	 * Converts a list of font families into font handles and returns them as an array.
	 *
	 * @param array $families_data An array of font families data.
	 * @return array An array containing font handles.
	 */
	private static function get_font_families( $families_data ) {
		$families = array();
		foreach ( $families_data as $family ) {
			$font_family = WP_Fonts_Utils::get_font_family_from_variation( $family );
			$handle      = WP_Fonts_Utils::convert_font_family_into_handle( $font_family );
			if ( ! empty( $handle ) ) {
				$families[ $handle ] = true;
			}
		}

		return ! empty( $families ) ? array_keys( $families ) : array();
	}

	/**
	 * Parse font families from theme.json.
	 *
	 * @param array $settings Font settings to parse.
	 * @return array Returns an array that contains font data and corresponding handles.
	 */
	private static function parse_font_families( array $settings ) {
		$handles = array();
		$fonts   = array();
		// Look for fontFamilies.
		foreach ( $settings['typography']['fontFamilies'] as $font_families ) {
			foreach ( $font_families as $font_family ) {

				// Skip if fontFace is not defined.
				if ( empty( $font_family['fontFace'] ) ) {
					continue;
				}

				$font_family['fontFace'] = (array) $font_family['fontFace'];

				foreach ( $font_family['fontFace'] as $font_face ) {
					// Skip if the font was registered through the Fonts API.
					if ( isset( $font_face['origin'] ) && WP_Fonts::REGISTERED_ORIGIN === $font_face['origin'] ) {
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

		return array( $fonts, $handles );
	}
}
