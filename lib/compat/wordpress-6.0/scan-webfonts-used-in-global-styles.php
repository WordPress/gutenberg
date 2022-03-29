<?php
/**
 * Webfonts API: scan and enqueue webfonts used in Global Styles.
 *
 * @package Gutenberg
 */

if ( ! function_exists( 'gutenberg_enqueue_webfonts_used_in_global_styles' ) ) {
	/**
	 * Extract the font family slug from a settings object.
	 *
	 * @param object $setting The setting object.
	 *
	 * @return string|void
	 */
	function gutenberg_extract_font_slug_from_setting( $setting ) {
		if ( isset( $setting['typography'] ) && isset( $setting['typography']['fontFamily'] ) ) {
			$font_family = $setting['typography']['fontFamily'];

			// Full string: var(--wp--preset--font-family--slug).
			// We do not care about the origin of the font, only its slug.
			preg_match( '/font-family--(?P<slug>.+)\)$/', $font_family, $matches );

			if ( isset( $matches['slug'] ) ) {
				return $matches['slug'];
			}

			// Full string: var:preset|font-family|slug
			// We do not care about the origin of the font, only its slug.
			preg_match( '/font-family\|(?P<slug>.+)$/', $font_family, $matches );

			if ( isset( $matches['slug'] ) ) {
				return $matches['slug'];
			}

			return $font_family;
		}
	}

	/**
	 * Looks for font families in the global styles and enqueue them.
	 */
	function gutenberg_enqueue_webfonts_used_in_global_styles() {
		$global_styles = gutenberg_get_global_styles();

		// Scan block presets looking for webfonts...
		if ( isset( $global_styles['blocks'] ) ) {
			foreach ( $global_styles['blocks'] as $setting ) {
				$font_slug = gutenberg_extract_font_slug_from_setting( $setting );

				if ( $font_slug ) {
					wp_webfonts()->enqueue_webfont( $font_slug );
				}
			}
		}

		// Scan HTML element presets looking for webfonts...
		if ( isset( $global_styles['elements'] ) ) {
			foreach ( $global_styles['elements'] as $setting ) {
				$font_slug = gutenberg_extract_font_slug_from_setting( $setting );

				if ( $font_slug ) {
					wp_webfonts()->enqueue_webfont( $font_slug );
				}
			}
		}

		// Check if a global typography setting was defined.
		$font_slug = gutenberg_extract_font_slug_from_setting( $global_styles );

		if ( $font_slug ) {
			wp_webfonts()->enqueue_webfont( $font_slug );
		}
	}

	/**
	 * We are already enqueueing all registered fonts by default when loading the block editor,
	 * so we only need to scan for webfonts when browsing as a guest.
	 */
	if ( ! is_admin() ) {
		add_action( 'wp_loaded', 'gutenberg_enqueue_webfonts_used_in_global_styles' );
	}
}
