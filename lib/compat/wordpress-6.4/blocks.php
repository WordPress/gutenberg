<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Adds delete_posts capabilities to the wp_block post type.
 *
 * @param array $args Register post type args.
 *
 * @return array Register post type args.
 */
function gutenberg_add_custom_capabilities_to_wp_block( $args ) {
	if ( is_array( $args ) ) {
		if ( ! isset( $args['capabilities'] ) || is_array( $args['capabilities'] ) ) {
			$args['capabilities']['delete_posts'] = 'delete_posts';
		}
	}
	return $args;
}
add_filter( 'register_wp_block_post_type_args', 'gutenberg_add_custom_capabilities_to_wp_block', 10, 1 );
