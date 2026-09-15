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
 * Whether the current admin screen is a Boot / WP Build page.
 *
 * Those pages bring their own stage layout and must not receive the classic
 * #wpcontent rounded-canvas class.
 *
 * @return bool
 */
function gutenberg_is_boot_wp_admin_page() {
	if ( isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$page = sanitize_key( wp_unslash( $_GET['page'] ) );
		if ( str_ends_with( $page, '-wp-admin' ) ) {
			return true;
		}
	}

	$screen = get_current_screen();
	if ( ! $screen ) {
		return false;
	}

	// Core-integrated Boot pages use the page slug as the screen ID.
	$core_boot_pages = array(
		'font-library',
		'options-connectors',
	);

	/**
	 * Filters the list of Core-integrated Boot admin screen IDs that should
	 * skip the classic rounded #wpcontent canvas.
	 *
	 * @param string[] $core_boot_pages Screen IDs.
	 */
	$core_boot_pages = apply_filters( 'gutenberg_rounded_admin_canvas_boot_screen_ids', $core_boot_pages );

	return in_array( $screen->id, $core_boot_pages, true );
}

/**
 * Adds body classes for the rounded admin canvas experiment.
 *
 * `gutenberg-rounded-admin-canvas` marks the experiment as active on every
 * admin screen (including Boot pages) so styles and Boot can adapt.
 * `admin-stage-rounded` enables the classic #wpcontent corner treatment —
 * skipped for block editors and Boot pages.
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

	if ( gutenberg_is_boot_wp_admin_page() ) {
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
