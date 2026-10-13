<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Side Meta Box
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-side-meta-box
 */

/**
 * Registers a meta box in the sidebar only.
 */
function gutenberg_test_side_meta_box_add() {
	add_meta_box(
		'gutenberg-test-side-meta-box',
		'Side Test Meta Box',
		static function () {
			echo '<p>Sidebar only</p>';
		},
		'post',
		'side',
		'high'
	);
}
add_action( 'add_meta_boxes', 'gutenberg_test_side_meta_box_add' );
