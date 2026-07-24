<?php
/**
 * REST API compatibility functions for real-time collaboration.
 *
 * @package gutenberg
 */

/**
 * Overrides the default REST controller for autosaves to fix real-time
 * collaboration on draft posts.
 *
 * When RTC is enabled, draft autosaves from all users update the post directly
 * instead of creating per-user autosave revisions depending on post lock and
 * assigned author.
 *
 * Only overrides when autosave_rest_controller_class is not explicitly set,
 * i.e. when WP_REST_Autosaves_Controller would be used by default. Post types
 * with their own specialized autosave controller (e.g. templates) are left alone.
 *
 * @param array $args Array of arguments for registering a post type.
 * @return array Modified array of arguments.
 */
function gutenberg_override_autosaves_rest_controller( $args ) {
	if ( empty( $args['autosave_rest_controller_class'] ) ) {
		$args['autosave_rest_controller_class'] = 'Gutenberg_REST_Autosaves_Controller';
	}
	return $args;
}

add_filter( 'register_post_type_args', 'gutenberg_override_autosaves_rest_controller', 10, 1 );
