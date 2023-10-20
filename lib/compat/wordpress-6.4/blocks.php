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

/**
 * Updates the wp_block REST enpoint in order to modify the wp_pattern_category action
 * links that are returned because as although the taxonomy is flat Author level users
 * are only allowed to assign categories.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.4.
 *
 * @see https://github.com/WordPress/gutenberg/pull/55379
 *
 * @param array  $args Register post type args.
 * @param string $post_type The post type string.
 *
 * @return array Register post type args.
 */
function gutenberg_update_patterns_block_rest_controller_class( $args, $post_type ) {
	if ( 'wp_block' === $post_type ) {
		$args['rest_controller_class'] = 'Gutenberg_REST_Blocks_Controller_6_4';
	}

	return $args;
}

add_filter( 'register_post_type_args', 'gutenberg_update_patterns_block_rest_controller_class', 11, 2 );
