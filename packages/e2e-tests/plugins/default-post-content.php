<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Default Post Content
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-plugin-default-post-content
 */

/**
 * Change the default title.
 */
function gutenberg_test_default_title() {
	return 'My default title';
}
add_filter( 'default_title', 'gutenberg_test_default_title' );

/**
 * Change the default post content.
 */
function gutenberg_test_default_content() {
	return 'My default content';
}
add_filter( 'default_content', 'gutenberg_test_default_content' );

/**
 * Change the default excerpt.
 */
function gutenberg_test_default_excerpt() {
	return 'My default excerpt';
}
add_filter( 'default_excerpt', 'gutenberg_test_default_excerpt' );
