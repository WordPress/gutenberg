<?php
/**
 * Rounded admin canvas experiment.
 *
 * Applies a dark frame and rounded corners to the classic wp-admin content
 * canvas when the experiment is enabled.
 *
 * @package gutenberg
 */

/**
 * Adds body classes for the rounded admin canvas experiment.
 *
 * `gutenberg-rounded-admin-canvas` marks the experiment as active on every
 * admin screen so styles and Boot can adapt.
 * `admin-stage-rounded` enables the rounded #wpcontent treatment — skipped
 * for full-screen block editors, which bring their own chrome.
 *
 * @param string $classes Space-separated admin body classes.
 * @return string
 */
function gutenberg_rounded_admin_canvas_body_class( $classes ) {
	$classes .= ' gutenberg-rounded-admin-canvas';

	$screen = get_current_screen();
	if ( $screen && $screen->is_block_editor() ) {
		return $classes;
	}

	$classes .= ' admin-stage-rounded';

	return $classes;
}
add_filter( 'admin_body_class', 'gutenberg_rounded_admin_canvas_body_class' );

/**
 * Enqueues the common-override stylesheet on every admin page.
 */
function gutenberg_enqueue_rounded_admin_canvas_styles() {
	wp_enqueue_style( 'wp-common-override' );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_enqueue_rounded_admin_canvas_styles' );
