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
				// Skip if the webfont was registered through the Webfonts API.
				if ( isset( $font_face['origin'] ) && 'gutenberg_wp_webfonts_api' === $font_face['origin'] ) {
					continue;
				}

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

	foreach ( $font_families_registered as $slug => $font_faces_for_family ) {
		$family = $font_faces_for_family[0]['font-family'];

		$font_faces = array();

		foreach ( $font_faces_for_family as $font_face ) {
			$camel_cased = array( 'origin' => 'gutenberg_wp_webfonts_api' );
			foreach ( $font_face as $key => $value ) {
				$camel_cased[ lcfirst( str_replace( '-', '', ucwords( $key, '-' ) ) ) ] = $value;
			}
			$font_faces[] = $camel_cased;
		}

		$data['settings']['typography']['fontFamilies'][] = array(
			'fontFamily' => false !== strpos( $family, ' ' ) ? "'{$family}'" : $family,
			'name'       => $family,
			'slug'       => $slug,
			'fontFace'   => $font_faces,
		);
	}

	return $data;
}

add_action( 'wp_loaded', 'gutenberg_register_webfonts_from_theme_json' );
