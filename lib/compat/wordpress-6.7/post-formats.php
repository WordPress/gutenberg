<?php
/**
 * Shims for changes to post formats until they are merged in all
 * versions of WordPress which Gutenberg supports.
 *
 * @package gutenberg
 */

/**
 * Registers the extension of the WP_REST_Posts_Controller class,
 * to add support for post formats.
 */
function gutenberg_post_format_rest_posts_controller( $args ) {
	/**
	 * This hook runs before support values are available via `post_type_supports`.
	 * Check registration arguments for REST API controller override.
	 */
	if ( ! empty( $args['supports'] ) && in_array( 'post-formats', $args['supports'], true ) ) {
		$args['rest_controller_class'] = 'Gutenberg_REST_Posts_Controller_6_7';
	}

	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_post_format_rest_posts_controller', 10 );
