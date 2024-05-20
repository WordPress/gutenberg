<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Adds support for excerpt to the wp_block post type.
 */
function gutenberg_add_excerpt_support_to_wp_block() {
	add_post_type_support( 'wp_block', 'excerpt' );
}

add_action( 'init', 'gutenberg_add_excerpt_support_to_wp_block' );

/**
 * Updates the labels for the template post type.
 *
 * @param  object $labels Object with labels for the post type as member variables.
 * @return object Object with all the labels as member variables.
 */
function gutenberg_update_wp_template_labels( $labels ) {
	$labels->add_new = __( 'Add Template', 'gutenberg' );
	$labels->add_new_item = __( 'Add Template', 'gutenberg' );
	$labels->item_updated = __( 'Template updated.', 'gutenberg' );
	return $labels;
}
add_filter( 'post_type_labels_wp_template', 'gutenberg_update_wp_template_labels', 10, 1 );

/**
 * Updates the labels for the template parts post type.
 *
 * @param  object $labels Object with labels for the post type as member variables.
 * @return object Object with all the labels as member variables.
 */
function gutenberg_update_wp_template__part_labels( $labels ) {
	$labels->add_new = __( 'Add Template Part', 'gutenberg' );
	$labels->add_new_item = __( 'Add Template Part', 'gutenberg' );
	$labels->item_updated = __( 'Template part updated.', 'gutenberg' );
	return $labels;
}
add_filter( 'post_type_labels_wp_template_part', 'gutenberg_update_wp_template__part_labels', 10, 1 );

/**
 * Updates the labels for the pattern post type.
 *
 * @param  object $labels Object with labels for the post type as member variables.
 * @return object Object with all the labels as member variables.
 */
function gutenberg_update_wp_block_labels( $labels ) {
	$labels->add_new = __( 'Add Pattern', 'gutenberg' );
	$labels->add_new_item = __( 'Add Pattern', 'gutenberg' );
	return $labels;
}
add_filter( 'post_type_labels_wp_block', 'gutenberg_update_wp_block_labels', 10, 1 );

/**
 * Updates the labels for the page post type.
 *
 * @param  object $labels Object with labels for the post type as member variables.
 * @return object Object with all the labels as member variables.
 */
function gutenberg_update_page_labels( $labels ) {
	$labels->add_new = __( 'Add Page', 'gutenberg' );
	$labels->add_new_item = __( 'Add Page', 'gutenberg' );
	return $labels;
}
add_filter( 'post_type_labels_page', 'gutenberg_update_page_labels', 10, 1 );
