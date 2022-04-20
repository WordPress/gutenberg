<?php
/**
 * Bootstraps Global Styles.
 *
 * @package gutenberg
 */

if ( ! function_exists( '_wp_register_webfonts_from_theme_json' ) ) {
	/**
	 * Register webfonts defined in theme.json
	 *
	 * @private
	 *
	 * @param array $settings The theme.json file.
	 */
	function _wp_register_webfonts_from_theme_json( $settings ) {
		// If in the editor, add webfonts defined in variations.
		if ( is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			$variations = WP_Theme_JSON_Resolver_Gutenberg::get_style_variations();

			foreach ( $variations as $variation ) {

				// Sanity check: Skip if fontFamilies are not defined in the variation.
				if ( empty( $variation['settings']['typography']['fontFamilies'] ) ) {
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
				// Skip if no `fontFaces` are defined.
				if ( empty( $font_family['fontFaces'] ) ) {
					continue;
				}

				// Fallback to the `local` provider if no `provider` is defined.
				if ( ! isset( $font_family['provider'] ) ) {
					$font_family['provider'] = 'local';
				}

				foreach ( $font_family['fontFaces'] as $font_face ) {

					// Transforms the source of the font face from `file.:/` into an actual URI.
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
					$font_face['provider'] = $font_family['provider'];
					$font_face             = _wp_array_keys_to_kebab_case( $font_face );

					$font_faces_to_register[] = $font_face;
				}
			}
		}
		wp_register_webfonts( $font_faces_to_register );
	}
}
