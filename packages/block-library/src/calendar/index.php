<?php
/**
 * Server-side rendering of the `core/calendar` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/calendar` block on server.
 *
 * @since 5.2.0
 *
 * @global int $monthnum.
 * @global int $year.
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
		if ( is_user_logged_in() ) {
			return '<div>' . __( 'The calendar block is hidden because there are no published posts.' ) . '</div>';
		}
		return '';
	}

	$previous_monthnum = $monthnum;
	$previous_year     = $year;

	if ( isset( $attributes['month'] ) && isset( $attributes['year'] ) ) {
		$permalink_structure = get_option( 'permalink_structure' );
		if (
			str_contains( $permalink_structure, '%monthnum%' ) &&
			str_contains( $permalink_structure, '%year%' )
		) {
			$monthnum = $attributes['month'];
			$year     = $attributes['year'];
		}
	}

	$color_block_styles = array();

	// Text color.
	$preset_text_color          = array_key_exists( 'textColor', $attributes ) ? "var:preset|color|{$attributes['textColor']}" : null;
	$custom_text_color          = $attributes['style']['color']['text'] ?? null;
	$color_block_styles['text'] = $preset_text_color ? $preset_text_color : $custom_text_color;

	// Background Color.
	$preset_background_color          = array_key_exists( 'backgroundColor', $attributes ) ? "var:preset|color|{$attributes['backgroundColor']}" : null;
	$custom_background_color          = $attributes['style']['color']['background'] ?? null;
	$color_block_styles['background'] = $preset_background_color ? $preset_background_color : $custom_background_color;

	// Generate color styles and classes.
	$styles        = wp_style_engine_get_styles( array( 'color' => $color_block_styles ), array( 'convert_vars_to_classnames' => true ) );
	$inline_styles = empty( $styles['css'] ) ? '' : sprintf( ' style="%s"', esc_attr( $styles['css'] ) );
	$classnames    = empty( $styles['classnames'] ) ? '' : ' ' . esc_attr( $styles['classnames'] );
	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classnames .= ' has-link-color';
	}
	// Apply color classes and styles to the calendar.
	$calendar = str_replace( '<table', '<table' . $inline_styles, get_calendar( true, false ) );
	$calendar = str_replace( 'class="wp-calendar-table', 'class="wp-calendar-table' . $classnames, $calendar );

	$wrapper_attributes = get_block_wrapper_attributes();
	$output             = sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$calendar
	);

	$monthnum = $previous_monthnum;
	$year     = $previous_year;

	return $output;
}

/**
 * Registers the `core/calendar` block on server.
 *
 * @since 5.2.0
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
 * Returns whether or not there are any published posts.
 *
 * Used to hide the calendar block when there are no published posts.
 * This compensates for a known Core bug: https://core.trac.wordpress.org/ticket/12016
 *
 * @since 5.9.0
 *
 * @return bool Has any published posts or not.
 */
function block_core_calendar_has_published_posts() {
	// Multisite already has an option that stores the count of the published posts.
	// Let's use that for multisites.
	if ( is_multisite() ) {
		return 0 < (int) get_option( 'post_count' );
	}

	// On single sites we try our own cached option first.
	$has_published_posts = get_option( 'wp_calendar_block_has_published_posts', null );
	if ( null !== $has_published_posts ) {
		return (bool) $has_published_posts;
	}

	// No cache hit, let's update the cache and return the cached value.
	return block_core_calendar_update_has_published_posts();
}

/**
 * Queries the database for any published post and saves
 * a flag whether any published post exists or not.
 *
 * @since 5.9.0
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @return bool Has any published posts or not.
 */
function block_core_calendar_update_has_published_posts() {
	global $wpdb;
	$has_published_posts = (bool) $wpdb->get_var( "SELECT 1 as test FROM {$wpdb->posts} WHERE post_type = 'post' AND post_status = 'publish' LIMIT 1" );
	update_option( 'wp_calendar_block_has_published_posts', $has_published_posts );
	return $has_published_posts;
}

// We only want to register these functions and actions when
// we are on single sites. On multi sites we use `post_count` option.
if ( ! is_multisite() ) {
	/**
	 * Handler for updating the has published posts flag when a post is deleted.
	 *
	 * @since 5.9.0
	 *
	 * @param int $post_id Deleted post ID.
	 */
	function block_core_calendar_update_has_published_post_on_delete( $post_id ) {
		$post = get_post( $post_id );

		if ( ! $post || 'publish' !== $post->post_status || 'post' !== $post->post_type ) {
			return;
		}

		block_core_calendar_update_has_published_posts();
	}

	/**
	 * Handler for updating the has published posts flag when a post status changes.
	 *
	 * @since 5.9.0
	 *
	 * @param string  $new_status The status the post is changing to.
	 * @param string  $old_status The status the post is changing from.
	 * @param WP_Post $post       Post object.
	 */
	function block_core_calendar_update_has_published_post_on_transition_post_status( $new_status, $old_status, $post ) {
		if ( $new_status === $old_status ) {
			return;
		}

		if ( 'post' !== get_post_type( $post ) ) {
			return;
		}

		if ( 'publish' !== $new_status && 'publish' !== $old_status ) {
			return;
		}

		block_core_calendar_update_has_published_posts();
	}

	add_action( 'delete_post', 'block_core_calendar_update_has_published_post_on_delete' );
	add_action( 'transition_post_status', 'block_core_calendar_update_has_published_post_on_transition_post_status', 10, 3 );
}
