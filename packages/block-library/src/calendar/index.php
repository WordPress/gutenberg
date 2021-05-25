<?php
/**
 * Server-side rendering of the `core/calendar` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/calendar` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the block content.
 */
function render_block_core_calendar( $attributes ) {
	global $monthnum, $year;

	// Calendar shouldn't be rendered
	// when there are no published posts on the site.
	if ( ! block_core_calendar_has_published_posts() ) {
		return '';
	}

	$previous_monthnum = $monthnum;
	$previous_year     = $year;

	if ( isset( $attributes['month'] ) && isset( $attributes['year'] ) ) {
		$permalink_structure = get_option( 'permalink_structure' );
		if (
			strpos( $permalink_structure, '%monthnum%' ) !== false &&
			strpos( $permalink_structure, '%year%' ) !== false
		) {
			// phpcs:ignore WordPress.WP.GlobalVariablesOverride.OverrideProhibited
			$monthnum = $attributes['month'];
			// phpcs:ignore WordPress.WP.GlobalVariablesOverride.OverrideProhibited
			$year = $attributes['year'];
		}
	}

	$wrapper_attributes = get_block_wrapper_attributes();
	$output             = sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		get_calendar( true, false )
	);

	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.OverrideProhibited
	$monthnum = $previous_monthnum;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.OverrideProhibited
	$year = $previous_year;

	return $output;
}

/**
 * Registers the `core/calendar` block on server.
 */
function register_block_core_calendar() {
	register_block_type_from_metadata(
		__DIR__ . '/calendar',
		array(
			'render_callback' => 'render_block_core_calendar',
		)
	);
}

add_action( 'init', 'register_block_core_calendar' );

/**
 * Returns whether or not there are currently published posts.
 *
 * Used to hide the calendar block when there are no published posts.
 * This compensates for a known Core bug: https://core.trac.wordpress.org/ticket/12016
 *
 * @return bool Has any published posts or not.
 */
function block_core_calendar_has_published_posts() {
	// 1. Multisite already has cached post counts, use them.
	if ( is_multisite() ) {
		return 0 < (int) get_option( 'post_count' );
	}
	// 2. Use our own cached version on single site.
	$has_published_posts = get_option( 'gutenberg_calendar_block_has_published_posts', null );
	if ( null !== $has_published_posts ) {
		return (bool) $has_published_posts;
	}
	// 3. Didn't get a cache hit, prime it.
	global $wpdb;
	$has_published_posts = (bool) $wpdb->get_var( "SELECT 1 as test FROM $wpdb->posts WHERE post_type = 'post' AND post_status = 'publish' LIMIT 1" );
	update_option( 'gutenberg_calendar_block_has_published_posts', $has_published_posts );

	return $has_published_posts;
}

/**
 * Delete the `gutenberg_calendar_block_has_published_posts` option after
 * publishing a post.
 *
 * @param int     $post_ID     Updated post ID.
 * @param WP_Post $post_after  Post object after update.
 */
function block_core_calendar_post_updated( $post_ID, $post_after ) {
	// Multisite already caches post counts and we use those.
	if ( is_multisite() ) {
		return;
	}
	if ( 'post' === $post_after->post_type ) {
		delete_option( 'gutenberg_calendar_block_has_published_posts' );
	}
}
add_action( 'post_updated', 'block_core_calendar_post_updated', 10, 2 );
