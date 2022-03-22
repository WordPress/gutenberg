<?php
/**
 * Bootstraps Global Styles.
 *
 * @package gutenberg
 */

/**
 * Register webfonts defined in theme.json.
 */
function gutenberg_register_webfonts_from_theme_json() {
	// Get settings from theme.json.
	$theme_settings = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_settings();

	// Bail out early if there are no settings for webfonts.
	if ( empty( $theme_settings['typography'] ) || empty( $theme_settings['typography']['fontFamilies'] ) ) {
		return;
	}

	$webfonts = array();

	// Look for fontFamilies.
	foreach ( $theme_settings['typography']['fontFamilies'] as $font_families ) {
		foreach ( $font_families as $font_family ) {

			// Skip if fontFace is not defined.
			if ( empty( $font_family['fontFace'] ) ) {
				continue;
			}

			$font_family['fontFace'] = (array) $font_family['fontFace'];

			foreach ( $font_family['fontFace'] as $font_face ) {
				// Check if webfonts have a "src" param, and if they do account for the use of "file:./".
				if ( ! empty( $font_face['src'] ) ) {
					$font_face['src'] = (array) $font_face['src'];

					foreach ( $font_face['src'] as $src_key => $url ) {
						// Tweak the URL to be relative to the theme root.
						if ( 0 !== strpos( $url, 'file:./' ) ) {
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

				$webfonts[] = $font_face;
			}
		}
	}
	foreach ( $webfonts as $webfont ) {
		wp_webfonts()->register_font( $webfont );
	}
}

/**
 * Add missing fonts data to the global styles.
 *
 * @param array $data The global styles.
 *
 * @return array The global styles with missing fonts data.
 */
function gutenberg_add_registered_webfonts_to_theme_json( $data ) {
	$font_families_registered = wp_webfonts()->get_fonts();
	$font_families_from_theme = array();
	if ( ! empty( $data['settings'] ) && ! empty( $data['settings']['typography'] ) && ! empty( $data['settings']['typography']['fontFamilies'] ) ) {
		$font_families_from_theme = $data['settings']['typography']['fontFamilies'];
	}

	/**
	 * Helper to get an array of the font-families.
	 *
	 * @param array $families_data The font-families data.
	 *
	 * @return array The font-families array.
	 */
	$get_families = function( $families_data ) {
		$families = array();
		foreach ( $families_data as $family ) {
			if ( isset( $family['font-family'] ) ) {
				$families[] = $family['font-family'];
			} elseif ( isset( $family['fontFamily'] ) ) {
				$families[] = $family['fontFamily'];
			}
		}

		// Micro-optimization: Use array_flip( array_flip( $array ) )
		// instead of array_unique( $array ) because it's faster.
		// The result is the same.
		return array_flip( array_flip( $families ) );
	};

	// Diff the arrays to find the missing fonts.
	$to_add = array_diff(
		$get_families( $font_families_registered ),
		$get_families( $font_families_from_theme )
	);

	// Bail out early if there are no missing fonts.
	if ( empty( $to_add ) ) {
		return $data;
	}

	// Make sure the path to settings.typography.fontFamilies.theme exists
	// before adding missing fonts.
	if ( empty( $data['settings'] ) ) {
		$data['settings'] = array();
	}
	if ( empty( $data['settings']['typography'] ) ) {
		$data['settings']['typography'] = array();
	}
	if ( empty( $data['settings']['typography']['fontFamilies'] ) ) {
		$data['settings']['typography']['fontFamilies'] = array();
	}

	// Add missing fonts.
	foreach ( $to_add as $family ) {
		$font_face = array();
		foreach ( $font_families_registered as $font_family ) {
			if ( $family !== $font_family['font-family'] ) {
				continue;
			}
			$camel_cased = array();
			foreach ( $font_family as $key => $value ) {
				$camel_cased[ lcfirst( str_replace( '-', '', ucwords( $key, '-' ) ) ) ] = $value;
			}
			$font_face[] = $camel_cased;
		}
		$data['settings']['typography']['fontFamilies'][] = array(
			'fontFamily' => false !== strpos( $family, ' ' ) ? "'{$family}'" : $family,
			'name'       => $family,
			'slug'       => sanitize_title( $family ),
			'fontFace'   => $font_face,
		);
	}

	return $data;
}

add_action( 'wp_loaded', 'gutenberg_register_webfonts_from_theme_json' );
