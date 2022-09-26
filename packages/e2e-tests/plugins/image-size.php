<?php
/**
 * Plugin Name: Gutenberg Test Image Size
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-image-size
 */

/**
 * Registers a custom script for the plugin.
 */
function gutenberg_test_create_image_size() {
	if ( function_exists( 'add_image_size' ) ) {
		add_image_size( 'custom-size-one', 499 );
	}
}

/**
 * Add custom size
 *
 * @param Array $sizes Size name.
 */
function gutenberg_test_create_image_size_name( $sizes ) {
	$custom_sizes = array(
		'custom-size-one' => 'Custom Size One',
	);
	return array_merge( $sizes, $custom_sizes );
}

add_action( 'after_setup_theme', 'gutenberg_test_create_image_size' );
add_filter( 'image_size_names_choose', 'gutenberg_test_create_image_size_name' );
