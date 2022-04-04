<?php
/**
 * Bootstraps Global Styles.
 *
 * @package gutenberg
 */

/**
 * Transforms the keys of the webfont defined in theme.json into
 * kebab case, so the Webfonts API can handle it.
 *
 * @param array $webfont The webfont to be tranformed.
 *
 * @return array The kebab-case version of the webfont.
 */
function gutenberg_webfont_to_kebab_case( $webfont ) {
	$kebab_cased_webfont = array();

	foreach ( $webfont as $key => $value ) {
		$kebab_cased_webfont[ _wp_to_kebab_case( $key ) ] = $value;
	}

	return $kebab_cased_webfont;
}

/**
 * Transforms the source of the font face from `file.:/` into an actual URI.
 *
 * @param array $font_face The font face.
 *
 * @return array The URI-resolved font face.
 */
function gutenberg_resolve_font_face_uri( $font_face ) {
	if ( empty( $font_face['src'] ) ) {
		return $font_face;
	}

	$font_face['src'] = (array) $font_face['src'];

	foreach ( $font_face['src'] as $src_key => $url ) {
		// Tweak the URL to be relative to the theme root.
		if ( ! str_starts_with( $url, 'file:./' ) ) {
			continue;
		}
		$font_face['src'][ $src_key ] = get_theme_file_uri( str_replace( 'file:./', '', $url ) );
	}

	return $font_face;
}

/**
 * Register webfonts defined in theme.json
 *
 * @param array $settings The theme.json file.
 */
function gutenberg_register_webfonts_from_theme_json( $settings ) {
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

	$font_faces_to_register = array();

	foreach ( $settings['typography']['fontFamilies'] as $font_families_by_origin ) {
		foreach ( $font_families_by_origin as $font_family ) {
			if ( isset( $font_family['provider'] ) ) {
				if ( empty( $font_family['fontFaces'] ) ) {
					trigger_error(
						sprintf(
							/* translators: %s: font family name */
							esc_html__( 'The "%s" font family specifies a provider, but no font faces.', 'gutenberg' ),
							esc_html( $font_family['fontFamily'] )
						)
					);

					continue;
				}

				foreach ( $font_family['fontFaces'] as $font_face ) {
					$font_face['provider'] = $font_family['provider'];
					$font_face             = gutenberg_resolve_font_face_uri( $font_face );
					$font_face             = gutenberg_webfont_to_kebab_case( $font_face );

					$font_faces_to_register[] = $font_face;
				}

				continue;
			}

			if ( ! isset( $font_family['fontFaces'] ) ) {
				continue;
			}

			foreach ( $font_family['fontFaces'] as $font_face ) {
				if ( isset( $font_face['provider'] ) ) {
					$font_face = gutenberg_resolve_font_face_uri( $font_face );
					$font_face = gutenberg_webfont_to_kebab_case( $font_face );

					$font_faces_to_register[] = $font_face;
				}
			}
		}
	}

	wp_register_webfonts( $font_faces_to_register );
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
