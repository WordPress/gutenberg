<?php
/**
 * Plugin Name: Gutenberg Test Lightbox Overlay Wrapper
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-lightbox-overlay-wrapper
 */

/**
 * Opens a wrapper around the page, so the lightbox overlay printed on
 * `wp_footer` is not a direct child of `<body>`.
 */
function gutenberg_test_lightbox_overlay_wrapper_open() {
	echo '<div id="site-wrap">';
}
add_action( 'wp_body_open', 'gutenberg_test_lightbox_overlay_wrapper_open' );

/**
 * Closes the wrapper after the lightbox overlay has been printed.
 */
function gutenberg_test_lightbox_overlay_wrapper_close() {
	echo '</div>';
}
add_action( 'wp_footer', 'gutenberg_test_lightbox_overlay_wrapper_close', 100 );
