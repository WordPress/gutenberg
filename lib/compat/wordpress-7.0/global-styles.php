<?php
/**
 * WordPress 7.0 compatibility functions for Global Styles.
 *
 * Overrides WordPress Core functions to enable full global styles support
 * (including fonts) for classic themes without theme.json.
 *
 * @package gutenberg
 */

// Remove WordPress Core's wp_print_font_faces action.
remove_action( 'wp_head', 'wp_print_font_faces', 50 );

/**
 * Gets font-face styles CSS for fonts from Gutenberg's global styles.
 *
 * WordPress Core's wp_print_font_faces() relies on wp_get_global_settings()
 * which excludes custom origin for classic themes. This function uses
 * Gutenberg's settings resolver to include user-customized fonts.
 *
 * @since Gutenberg 20.0.0
 * @return string Font-face CSS.
 */
function gutenberg_get_font_face_styles() {
	// Get settings using Gutenberg's resolver with custom origin.
	$settings = gutenberg_get_global_settings();

	// Bail out early if there are no font settings.
	if ( empty( $settings['typography']['fontFamilies'] ) ) {
		return '';
	}

	// Parse fonts from settings.
	$fonts = array();
	foreach ( $settings['typography']['fontFamilies'] as $font_families ) {
		foreach ( $font_families as $definition ) {
			// Skip if "fontFace" is not defined, meaning there are no variations.
			if ( empty( $definition['fontFace'] ) ) {
				continue;
			}

			// Skip if "fontFamily" is not defined.
			if ( empty( $definition['fontFamily'] ) ) {
				continue;
			}

			$font_family_name = $definition['fontFamily'];
			// Parse font-family name from comma-separated lists.
			if ( str_contains( $font_family_name, ',' ) ) {
				$font_family_name = explode( ',', $font_family_name )[0];
			}
			$font_family_name = trim( $font_family_name, "\"'" );

			// Skip if no font family is defined.
			if ( empty( $font_family_name ) ) {
				continue;
			}

			// Convert font face properties.
			$converted_font_faces = array();
			foreach ( $definition['fontFace'] as $font_face ) {
				// Add the font-family property to the font-face.
				$font_face['font-family'] = $font_family_name;

				// Convert relative font URLs to absolute theme URLs.
				if ( ! empty( $font_face['src'] ) ) {
					$src         = (array) $font_face['src'];
					$placeholder = 'file:./';

					foreach ( $src as $src_key => $src_url ) {
						// Skip if the src doesn't start with the placeholder
						if ( ! str_starts_with( $src_url, $placeholder ) ) {
							continue;
						}

						$src_file        = str_replace( $placeholder, '', $src_url );
						$src[ $src_key ] = get_theme_file_uri( $src_file );
					}

					$font_face['src'] = $src;
				}

				// Convert camelCase to kebab-case.
				$converted_face = array();
				foreach ( $font_face as $key => $value ) {
					$kebab_case                    = _wp_to_kebab_case( $key );
					$converted_face[ $kebab_case ] = $value;
				}

				$converted_font_faces[] = $converted_face;
			}

			$fonts[] = $converted_font_faces;
		}
	}

	if ( empty( $fonts ) ) {
		return '';
	}

	// Use WordPress Core's WP_Font_Face class to generate the CSS.
	if ( ! class_exists( 'WP_Font_Face' ) ) {
		return '';
	}

	// WP_Font_Face only has generate_and_print(), so use output buffering to capture.
	ob_start();
	$wp_font_face = new WP_Font_Face();
	$wp_font_face->generate_and_print( $fonts );
	$css = ob_get_clean();

	// Remove the wrapping <style> tags if present, we'll add our own.
	$css = preg_replace( '/<\/?style[^>]*>/', '', $css );

	return trim( $css );
}

/**
 * Prints font-face styles for fonts on the frontend.
 *
 * @since Gutenberg 20.0.0
 */
function gutenberg_print_font_faces() {
	$font_face_styles = gutenberg_get_font_face_styles();
	if ( ! empty( $font_face_styles ) ) {
		printf( "<style id='wp-fonts-local'>\n%s\n</style>\n", $font_face_styles );
	}
}
add_action( 'wp_head', 'gutenberg_print_font_faces', 50 );

/**
 * Adds font-face styles to block editor settings.
 *
 * @since Gutenberg 20.0.0
 *
 * @param array $settings Block editor settings.
 * @return array Modified settings.
 */
function gutenberg_add_font_face_styles_to_editor( $settings ) {
	$font_face_styles = gutenberg_get_font_face_styles();

	if ( ! empty( $font_face_styles ) ) {
		// Add font faces as a style entry in the editor settings.
		if ( ! isset( $settings['styles'] ) ) {
			$settings['styles'] = array();
		}

		// Insert font faces at the beginning so they load before other styles.
		array_unshift(
			$settings['styles'],
			array(
				'css'            => $font_face_styles,
				'__unstableType' => 'font-faces',
				'isGlobalStyles' => false,
			)
		);
	}

	return $settings;
}
// Run after gutenberg_get_block_editor_settings() which runs at priority 0.
add_filter( 'block_editor_settings_all', 'gutenberg_add_font_face_styles_to_editor', 5 );
