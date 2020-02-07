<?php
/**
 * Temporary compatibility shims for features present in Gutenberg, pending
 * upstream commit to the WordPress core source repository. Functions here
 * exist only as long as necessary for corresponding WordPress support, and
 * each should be associated with a Trac ticket.
 *
 * @package gutenberg
 */

/**
 * Filters allowed CSS attributes to include `flex-basis`, included in saved
 * markup of the Column block.
 *
 * This can be removed when plugin support requires WordPress 5.3.0+.
 *
 * @see https://core.trac.wordpress.org/ticket/47281
 * @see https://core.trac.wordpress.org/changeset/45363
 *
 * @since 5.7.0
 *
 * @param string[] $attr Array of allowed CSS attributes.
 *
 * @return string[] Filtered array of allowed CSS attributes.
 */
function gutenberg_safe_style_css_column_flex_basis( $attr ) {
	$attr[] = 'flex-basis';

	return $attr;
}
add_filter( 'safe_style_css', 'gutenberg_safe_style_css_column_flex_basis' );

/**
 * Adds a polyfill for the WHATWG URL in environments which do not support it.
 * The intention in how this action is handled is under the assumption that this
 * code would eventually be placed at `wp_default_packages_vendor`, which is
 * called as a result of `wp_default_packages` via the `wp_default_scripts`.
 *
 * This can be removed when plugin support requires WordPress 5.4.0+.
 *
 * @see https://core.trac.wordpress.org/ticket/49360
 * @see https://developer.mozilla.org/en-US/docs/Web/API/URL/URL
 * @see https://developer.wordpress.org/reference/functions/wp_default_packages_vendor/
 *
 * @since 7.3.0
 *
 * @param WP_Scripts $scripts WP_Scripts object.
 */
function gutenberg_add_url_polyfill( $scripts ) {
	// Only register polyfill if not already registered. This prevents handling
	// in an environment where core has updated to manage the polyfill. This
	// depends on the action being handled after default script registration.
	$is_polyfill_script_registered = (bool) $scripts->query( 'wp-polyfill-url', 'registered' );
	if ( $is_polyfill_script_registered ) {
		return;
	}

	gutenberg_register_vendor_script(
		$scripts,
		'wp-polyfill-url',
		'https://unpkg.com/polyfill-library@3.42.0/polyfills/URL/polyfill.js',
		array(),
		'3.42.0'
	);

	did_action( 'init' ) && $scripts->add_inline_script(
		'wp-polyfill',
		wp_get_script_polyfill(
			$scripts,
			array(
				'\'URL\' in window' => 'wp-polyfill-url',
			)
		)
	);
}
add_action( 'wp_default_scripts', 'gutenberg_add_url_polyfill', 20 );

/**
 * Adds a polyfill for DOMRect in environments which do not support it.
 *
 * This can be removed when plugin support requires WordPress 5.4.0+.
 *
 * @see gutenberg_add_url_polyfill
 * @see https://core.trac.wordpress.org/ticket/49360
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMRect
 * @see https://developer.wordpress.org/reference/functions/wp_default_packages_vendor/
 *
 * @since 7.5.0
 *
 * @param WP_Scripts $scripts WP_Scripts object.
 */
function gutenberg_add_dom_rect_polyfill( $scripts ) {
	// Only register polyfill if not already registered. This prevents handling
	// in an environment where core has updated to manage the polyfill. This
	// depends on the action being handled after default script registration.
	$is_polyfill_script_registered = (bool) $scripts->query( 'wp-polyfill-dom-rect', 'registered' );
	if ( $is_polyfill_script_registered ) {
		return;
	}

	gutenberg_register_vendor_script(
		$scripts,
		'wp-polyfill-dom-rect',
		'https://unpkg.com/polyfill-library@3.42.0/polyfills/DOMRect/polyfill.js',
		array(),
		'3.42.0'
	);

	did_action( 'init' ) && $scripts->add_inline_script(
		'wp-polyfill',
		wp_get_script_polyfill(
			$scripts,
			array(
				'window.DOMRect' => 'wp-polyfill-dom-rect',
			)
		)
	);
}
add_action( 'wp_default_scripts', 'gutenberg_add_dom_rect_polyfill', 20 );

/**
 * Sets the current post for usage in template blocks.
 *
 * @return WP_Post|null The post if any, or null otherwise.
 */
function gutenberg_get_post_from_context() {
	// TODO: Without this temporary fix, an infinite loop can occur where
	// posts with post content blocks render themselves recursively.
	if ( is_admin() || defined( 'REST_REQUEST' ) ) {
		return null;
	}
	if ( ! in_the_loop() ) {
		rewind_posts();
		the_post();
	}
	return get_post();
}
