<?php
/**
 * Extend theme.json with programmatically registered webfonts.
 *
 * @package gutenberg
 */

function gutenberg_is_webfont_equal( $a, $b, $is_camel_case = true ) {
	$equality_attrs = $is_camel_case ? array(
		'fontFamily',
		'fontStyle',
		'fontWeight',
	) : array(
		'font-family',
		'font-style',
		'font-weight',
	);

	foreach ( $equality_attrs as $attr ) {
		if ( $a[ $attr ] !== $b[ $attr ] ) {
			return false;
		}
	}

	return true;
}

function gutenberg_find_webfont( $webfonts, $webfont_to_find ) {
	if ( ! count( $webfonts ) ) {
		return false;
	}

	$is_camel_case = isset( $webfonts[0]['fontFamily'] );

	foreach ( $webfonts as $index => $webfont ) {
		if ( gutenberg_is_webfont_equal( $webfont, $webfont_to_find, $is_camel_case ) ) {
			return $index;
		}
	}

	return false;
}

function gutenberg_webfont_to_camel_case( $webfont ) {
	$camel_cased_webfont = array();

	foreach ( $webfont as $key => $value ) {
		$camel_cased_webfont[ lcfirst( str_replace( '-', '', ucwords( $key, '-' ) ) ) ] = $value;
	}

	return $camel_cased_webfont;
}

function gutenberg_get_font_family_indexes( $families ) {
	$indexes = array();

	foreach ( $families as $index => $family ) {
		$indexes[ wp_webfonts()->get_font_slug( $family ) ] = $index;
	}

	return $indexes;
}

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

	$font_family_indexes_in_theme_json = gutenberg_get_font_family_indexes( $data['settings']['typography']['fontFamilies'] );

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
