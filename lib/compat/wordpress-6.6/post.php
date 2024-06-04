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
 * Add the rendering_mode property to the WP_Post_Type object.
 * This property can be overwritten by using the post_type_default_rendering_mode filter.
 *
 * @param array $args Array of post type arguments.
 * @return array Updated array of post type arguments.
 */
function gutenberg_post_type_default_rendering_mode( $args ) {
	if (
		( isset( $args['show_in_rest'] ) && $args['show_in_rest'] ) &&
		( isset( $args['supports'] ) && in_array( 'editor', $args['supports'], true ) )
	) {
		$args['rendering_mode'] = 'post-only';
	}

	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_post_type_default_rendering_mode', 10, 2 );

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
