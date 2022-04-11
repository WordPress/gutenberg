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
			$settings['typography']                 = empty( $settings['typography'] ) ? array() : $settings['typography'];
			$settings['typography']['fontFamilies'] = empty( $settings['typography']['fontFamilies'] ) ? array() : $settings['typography']['fontFamilies'];
			$settings['typography']['fontFamilies'] = array_merge( $settings['typography']['fontFamilies'], $variation['settings']['typography']['fontFamilies'] );

			// Make sure there are no duplicates.
			$settings['typography']['fontFamilies'] = array_unique( $settings['typography']['fontFamilies'] );
		}
	}

	// Bail out early if there are no settings for webfonts.
	if ( empty( $settings['typography'] ) || empty( $settings['typography']['fontFamilies'] ) ) {
		return;
	}

	$webfonts = array();

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

				$webfonts[] = $font_face;
			}
		}
	}
	foreach ( $webfonts as $webfont ) {
		wp_webfonts()->register_webfont( $webfont );
		wp_webfonts()->enqueue_webfont( $webfont['font-family'] );
	}
}

/**
 * Add missing fonts data to the global styles.
 *
 * @param array $data The global styles.
 * @return array The global styles with missing fonts data.
 */
function gutenberg_add_registered_webfonts_to_theme_json( $data ) {
	$font_families_registered = wp_webfonts()->get_all_webfonts();
	$font_families_from_theme = array();
	if ( ! empty( $data['settings'] ) && ! empty( $data['settings']['typography'] ) && ! empty( $data['settings']['typography']['fontFamilies'] ) ) {
		$font_families_from_theme = $data['settings']['typography']['fontFamilies'];
	}

	/**
	 * Helper to get an array of the font-families.
	 *
	 * @param array $families_data The font-families data.
	 * @return array The font-families array.
	 */
	$get_families = static function( $families_data ) {
		$families = array();
		foreach ( $families_data as $family ) {
			$families[] = WP_Webfonts::get_font_slug( $family );
		}

		// Micro-optimization: Use array_flip( array_flip( $array ) )
		// instead of array_unique( $array ) because it's faster.
		// The result is the same.
		return array_flip( array_flip( $families ) );
	};

	// Diff the arrays to find the missing fonts.
	$to_add = array_diff(
		array_keys( $font_families_registered ),
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

	foreach ( $to_add as $slug ) {
		$font_faces_for_family = $font_families_registered[ $slug ];
		$family_name           = $font_faces_for_family[0]['font-family'];
		$font_faces            = array();

		foreach ( $font_faces_for_family as $font_face ) {
			$camel_cased = array( 'origin' => 'gutenberg_wp_webfonts_api' );
			foreach ( $font_face as $key => $value ) {
				$camel_cased[ lcfirst( str_replace( '-', '', ucwords( $key, '-' ) ) ) ] = $value;
			}
			$font_faces[] = $camel_cased;
		}

		$data['settings']['typography']['fontFamilies'][] = array(
			'fontFamily' => str_contains( $family_name, ' ' ) ? "'{$family_name}'" : $family_name,
			'name'       => $family_name,
			'slug'       => $slug,
			'fontFace'   => $font_faces,
		);
	}

	return $data;
}

add_action( 'init', 'gutenberg_register_webfonts_from_theme_json' );
