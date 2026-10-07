<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Side Meta Box
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-side-meta-box
 */

/**
 * Prints string for meta box
 */
function gutenberg_test_side_meta_box_render_meta_box() {
	echo 'Hello from the sidebar';
}

/**
 * Add a test meta box to the sidebar only
 */
function gutenberg_test_side_meta_box_add_meta_box() {
	add_meta_box(
		'gutenberg-test-side-meta-box',
		'Gutenberg Test Side Meta Box',
		'gutenberg_test_side_meta_box_render_meta_box',
		'post',
		'side'
	);
}
add_action( 'add_meta_boxes', 'gutenberg_test_side_meta_box_add_meta_box' );
