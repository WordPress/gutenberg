<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Side Meta Box Only
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-meta-box-side-only
 */

/**
 * Prints string for meta box.
 */
function gutenberg_test_meta_box_side_only_render_meta_box() {
	echo 'Hello Side';
}

/**
 * Adds a test meta box in the `side` location only.
 */
function gutenberg_test_meta_box_side_only_add_meta_box() {
	add_meta_box(
		'gutenberg-test-meta-box-side-only',
		'Gutenberg Test Side Meta Box',
		'gutenberg_test_meta_box_side_only_render_meta_box',
		'post',
		'side',
		'high'
	);
}
add_action( 'add_meta_boxes', 'gutenberg_test_meta_box_side_only_add_meta_box' );
