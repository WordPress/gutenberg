<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Meta Box Pane Label
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-meta-box-pane-label
 */

/**
 * Names the meta box pane of posts with the `meta_boxes` post type label.
 *
 * @param object $labels The labels of the post post type.
 * @return object The labels with `meta_boxes` set.
 */
function gutenberg_test_meta_box_pane_label( $labels ) {
	$labels->meta_boxes = 'Post Options';
	return $labels;
}
add_filter( 'post_type_labels_post', 'gutenberg_test_meta_box_pane_label' );
