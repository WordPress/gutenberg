<?php
/**
 * Temporary compatibility shims for changes to post formats in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Registers the extension of the WP_REST_Posts_Controller class,
 * to add support for post formats.
 */
function gutenberg_post_format_rest_posts_controller( $args, $post_type ) {
	if ( post_type_supports( $post_type, 'post-formats' ) ) {
		$args['rest_controller_class'] = 'Gutenberg_REST_Posts_Controller_6_7';
	}

	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_post_format_rest_posts_controller', 10, 2 );
