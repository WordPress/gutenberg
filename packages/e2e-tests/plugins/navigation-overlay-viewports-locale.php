<?php
/**
 * Plugin Name: Gutenberg Test Navigation Overlay Viewports Locale
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Shows the Navigation overlay at different viewports for each language, so
 * menus with longer translated labels collapse earlier. The current language
 * comes from the `lang` query argument.
 *
 * @package gutenberg-test-navigation-overlay-viewports-locale
 */

/**
 * Returns the overlay viewports for each language that needs its own.
 *
 * Languages not listed keep the viewports chosen in the block settings.
 *
 * @return array Viewport maps keyed by language.
 */
function navigation_overlay_viewports_locale_get_map() {
	return array(
		// German labels are longer, so show the overlay on tablets too.
		'de' => array(
			'mobile'  => true,
			'tablet'  => true,
			'desktop' => false,
		),
	);
}

/**
 * Returns the current language from the `lang` query argument.
 *
 * @return string Language code, or an empty string.
 */
function navigation_overlay_viewports_locale_get_language() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only.
	return isset( $_GET['lang'] ) ? sanitize_key( wp_unslash( $_GET['lang'] ) ) : '';
}

/**
 * Uses the current language's overlay viewports on the front end.
 *
 * @param array|null $overlay_viewports Viewport map, or null.
 * @return array|null Viewport map, or null.
 */
function navigation_overlay_viewports_locale_filter( $overlay_viewports ) {
	$map      = navigation_overlay_viewports_locale_get_map();
	$language = navigation_overlay_viewports_locale_get_language();

	return $map[ $language ] ?? $overlay_viewports;
}

add_filter( 'block_core_navigation_overlay_viewports', 'navigation_overlay_viewports_locale_filter' );

/**
 * Enqueues the matching editor filter, passing it the same map.
 */
function navigation_overlay_viewports_locale_enqueue_editor_script() {
	wp_enqueue_script(
		'gutenberg-test-navigation-overlay-viewports-locale',
		plugins_url( 'navigation-overlay-viewports-locale/index.js', __FILE__ ),
		array( 'wp-data', 'wp-hooks' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'navigation-overlay-viewports-locale/index.js' ),
		true
	);

	wp_add_inline_script(
		'gutenberg-test-navigation-overlay-viewports-locale',
		'window.navigationOverlayViewportsLocale = ' . wp_json_encode(
			array(
				'map'      => navigation_overlay_viewports_locale_get_map(),
				'language' => navigation_overlay_viewports_locale_get_language(),
			)
		) . ';',
		'before'
	);
}

add_action( 'enqueue_block_editor_assets', 'navigation_overlay_viewports_locale_enqueue_editor_script' );
