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

	if ( ! block_core_calendar_get_has_published_posts() ) {
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
 * Returns the cached value whether any published post exists or not.
 * In case of missing cached value, it updates the cache.
 *
 * @return bool Has any published posts or not.
 */
function block_core_calendar_get_has_published_posts() {
	$has_published_posts = get_option( 'gutenberg_calendar_block_has_published_posts', null );
	if ( null === $has_published_posts ) {
		$has_published_posts = block_core_calendar_update_has_published_posts();
	}
	return $has_published_posts;
}

/**
 * Queries the database for any published post and saves
 * a flag whether any published post exists or not.
 *
 * @return bool Has any published posts or not.
 */
function block_core_calendar_update_has_published_posts() {
	global $wpdb;
	$has_published_posts = ! ! $wpdb->get_var( "SELECT 1 as test FROM $wpdb->posts WHERE post_type = 'post' AND post_status = 'publish' LIMIT 1" );
	update_option( 'gutenberg_calendar_block_has_published_posts', $has_published_posts );
	return $has_published_posts;
}

/**
 * Update `has_published_posts` cached value
 * if the updated post's type is `post`.
 *
 * @param int     $post_ID     Updated post ID.
 * @param WP_Post $post_after  Post object after update.
 */
function block_core_calendar_post_updated( $post_ID, $post_after ) {
	if ( 'post' === $post_after->post_type ) {
		block_core_calendar_update_has_published_posts();
	}
}
add_action( 'post_updated', 'block_core_calendar_post_updated', 10, 2 );
