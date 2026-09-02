<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Overrides the REST controller for revisions so that a revision carries its
 * author's display name and avatar URLs.
 *
 * Replaces the WordPress 7.0 override, which this controller extends. A site
 * that has set its own controller keeps it.
 *
 * @since 7.2.0
 *
 * @param array $args Array of arguments for registering a post type.
 * @return array Modified array of arguments.
 */
function gutenberg_override_revisions_rest_controller_7_2( $args ) {
	if (
		empty( $args['revisions_rest_controller_class'] ) ||
		'Gutenberg_REST_Revisions_Controller' === $args['revisions_rest_controller_class']
	) {
		$args['revisions_rest_controller_class'] = 'Gutenberg_REST_Revisions_Controller_7_2';
	}

	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_override_revisions_rest_controller_7_2', 11, 1 );
