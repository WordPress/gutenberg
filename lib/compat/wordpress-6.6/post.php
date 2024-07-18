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
	$labels->item_updated = __( 'Template part updated.', 'gutenberg' );
	return $labels;
}
add_filter( 'post_type_labels_wp_template_part', 'gutenberg_update_wp_template__part_labels', 10, 1 );
