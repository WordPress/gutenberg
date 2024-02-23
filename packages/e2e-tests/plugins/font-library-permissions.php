<?php
/**
 * Plugin Name: Gutenberg Test Font Library Permissions
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-font-library-permissions
 */

/**
 * Add custom permissions to disallow creating and deleting font families.
 */
add_filter( 'register_post_type_args', function( $args, $post_type ) {
	if ( $post_type === 'wp_font_family' ) {
		$args['capabilities']['create_posts'] = 'do_not_allow';
		$args['capabilities']['delete_published_posts'] = 'do_not_allow';
	}
	return $args;
}, 10, 2 );
