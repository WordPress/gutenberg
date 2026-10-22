<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Tall Meta Box
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-tall-meta-box
 */

/**
 * Registers a meta box taller than the viewport.
 */
function gutenberg_test_tall_meta_box_add() {
	add_meta_box(
		'gutenberg-test-tall-meta-box',
		'Tall Test Meta Box',
		static function () {
			echo '<div id="gutenberg-tall-meta-box" style="height:2000px">Tall meta box</div>';
		},
		'post',
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'gutenberg_test_tall_meta_box_add' );
