<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Post Formats Support
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-plugin-post-formats
 */

add_theme_support( 'post-formats', array( 'image', 'gallery' ) );
add_action( 'init', 'gutenberg_test_plugin_post_formats_add_post_support', 11 );

/**
 * Add post-formats support to pages
 */
function gutenberg_test_plugin_post_formats_add_post_support() {
	add_post_type_support( 'page', 'post-formats' );
}
