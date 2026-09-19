<?php
/**
 * Plugin Name: Gutenberg Test Navigation Link Hyphenated Post Type
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-navigation-link-hyphenated-post-type
 */

/**
 * Registers a public post type with a hyphen in its slug, so that it gets a
 * Navigation Link variation and can be linked to from the Navigation.
 */
function gutenberg_test_register_hyphenated_post_type() {
	register_post_type(
		'event-series',
		array(
			'labels'            => array(
				'name'          => 'Event Series',
				'singular_name' => 'Event Series',
			),
			'public'            => true,
			'show_in_rest'      => true,
			'show_in_nav_menus' => true,
			'supports'          => array( 'title', 'editor' ),
		)
	);
}
add_action( 'init', 'gutenberg_test_register_hyphenated_post_type' );
