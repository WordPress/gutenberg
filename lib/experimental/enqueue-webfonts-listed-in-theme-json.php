<?php
/**
 * Emit inline CSS for allowed webfonts listed in theme.json.
 *
 * @package gutenberg
 */

/**
 * Check if the webfont was registered programmatically.
 *
 * @param array $webfont The webfont that'll have their origin checked.
 *
 * @return boolean True if registered programmatically, false otherwise.
 */
function gutenberg_is_externally_registered_webfont( $webfont ) {
	return isset( $webfont['origin'] ) && 'gutenberg_wp_webfonts_api' === $webfont['origin'];
}

/**
 * Enqueue webfonts listed in theme.json.
 *
 * Enqueued webfonts will end up in the front-end as inlined CSS.
 */
function gutenberg_enqueue_webfonts_listed_in_theme_json() {
	$settings = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data()->get_settings();

	// Bail out early if there are no settings for webfonts.
	if ( empty( $settings['typography'] ) || empty( $settings['typography']['fontFamilies'] ) ) {
		return;
	}

	// Look for fontFamilies.
	foreach ( $settings['typography']['fontFamilies'] as $font_families ) {
		foreach ( $font_families as $font_family ) {
			// Skip dynamically included font families. We only want to enqueue explicitly added fonts.
			if ( gutenberg_is_externally_registered_webfont( $font_family ) ) {
				continue;
			}

			// If no font faces defined.
			if ( ! isset( $font_family['fontFaces'] ) ) {
				// And the font family is registered.
				if ( ! wp_webfonts()->is_font_family_registered( $font_family['fontFamily'] ) ) {
					continue;
				}

				// Enqueue the entire family.
				wp_webfonts()->enqueue_webfont( $font_family );
				continue;
			}

			// Loop through all the font faces, enqueueing each one of them.
			foreach ( $font_family['fontFaces'] as $font_face ) {
				// Skip dynamically included font faces. We only want to enqueue the font faces listed in theme.json.
				if ( gutenberg_is_externally_registered_webfont( $font_face ) ) {
					continue;
				}

				wp_webfonts()->enqueue_webfont( $font_family, $font_face );
			}
		}
	}
}

add_filter( 'wp_loaded', 'gutenberg_enqueue_webfonts_listed_in_theme_json' );

// No need to run this -- opening the admin interface enqueues all the webfonts.
add_action(
	'admin_init',
	function() {
		remove_filter( 'wp_loaded', 'gutenberg_enqueue_webfonts_listed_in_theme_json' );
	}
);
