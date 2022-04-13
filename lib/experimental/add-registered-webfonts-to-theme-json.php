<?php
/**
 * Extend theme.json with programmatically registered webfonts.
 *
 * @package gutenberg
 */

/**
 * Add missing fonts data to the global styles.
 *
 * @param array $data The global styles.
 * @return array The global styles with missing fonts data.
 */
function gutenberg_add_registered_webfonts_to_theme_json( $data ) {
	$registered_font_families = wp_webfonts()->get_all_webfonts();

	if ( empty( $registered_font_families ) ) {
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

	/**
	 * Map the font families by slug to their corresponding index
	 * in theme.json, so we can avoid looping theme.json looking for
	 * font families every time we want to register a face.
	 */
	$font_family_indexes_in_theme_json = array();

	foreach ( $data['settings']['typography']['fontFamilies'] as $index => $family ) {
		$font_family_indexes_in_theme_json[ wp_webfonts()->get_font_slug( $family ) ] = $index;
	}

	foreach ( $registered_font_families as $slug => $registered_font_faces ) {
		// Font family not in theme.json, so let's add it.
		if ( ! isset( $font_family_indexes_in_theme_json[ $slug ] ) ) {
			$family_name = $registered_font_faces[0]['font-family'];

			$data['settings']['typography']['fontFamilies'][] = array(
				'origin'     => 'gutenberg_wp_webfonts_api',
				'fontFamily' => str_contains( $family_name, ' ' ) ? "'{$family_name}'" : $family_name,
				'name'       => $family_name,
				'slug'       => $slug,
				'fontFaces'  => array_map(
					function( $font_face ) {
						$font_face['origin'] = 'gutenberg_wp_webfonts_api';

						return gutenberg_webfont_to_camel_case( $font_face );
					},
					$registered_font_faces
				),
			);

			continue;
		}

		$font_family_index_in_theme_json = $font_family_indexes_in_theme_json[ $slug ];
		$font_family_in_theme_json       = $data['settings']['typography']['fontFamilies'][ $font_family_index_in_theme_json ];

		if ( ! isset( $font_family_in_theme_json['fontFaces'] ) ) {
			// Font family exists, but it's not declaring any font face
			// Let's not get in their way.
			continue;
		}

		$font_faces_in_theme_json = $font_family_in_theme_json['fontFaces'];

		foreach ( $registered_font_faces as $registered_font_face ) {
			$registered_font_face = gutenberg_webfont_to_camel_case( $registered_font_face );

			if ( false !== gutenberg_find_webfont( $font_faces_in_theme_json, $registered_font_face ) ) {
				// Webfont is already there, so let's not add it.
				continue;
			}

			$registered_font_face['origin'] = 'gutenberg_wp_webfonts_api';

			$data['settings']['typography']['fontFamilies'][ $font_family_index_in_theme_json ]['fontFaces'][] = $registered_font_face;
		}
	}

	return $data;
}
