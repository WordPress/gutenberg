<?php
/**
 * Plugin Name: Gutenberg Test Plugin, RTC Compatible Meta Box
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-rtc-compatible-meta-box
 */

/**
 * Renders the RTC-compatible test meta box.
 */
function gutenberg_test_rtc_compatible_meta_box_render() {
	echo 'RTC Compatible Meta Box';
}

/**
 * Registers a meta box marked as compatible with real-time collaboration.
 */
function gutenberg_test_rtc_compatible_meta_box_add() {
	add_meta_box(
		'gutenberg-test-rtc-compatible-meta-box',
		'RTC Compatible Test Meta Box',
		'gutenberg_test_rtc_compatible_meta_box_render',
		'post',
		'normal',
		'high',
		array( '__rtc_compatible_meta_box' => true )
	);
}
add_action( 'add_meta_boxes', 'gutenberg_test_rtc_compatible_meta_box_add' );
