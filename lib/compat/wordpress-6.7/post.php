<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Add the default_rendering_mode property to the WP_Post_Type object.
 * This property can be overwritten by using the post_type_default_rendering_mode filter.
 *
 * @param array  $args      Array of post type arguments.
 * @return array Updated array of post type arguments.
 */
function gutenberg_post_type_default_rendering_mode( $args ) {
	if (
		( isset( $args['show_in_rest'] ) && $args['show_in_rest'] ) &&
		( isset( $args['supports'] ) && in_array( 'editor', $args['supports'], true ) ) &&
		( ! isset( $args['default_rendering_mode'] ) )
	) {
		$args['default_rendering_mode'] = 'post-only';
	}

	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_post_type_default_rendering_mode', 10, 1 );
