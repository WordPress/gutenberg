<?php
/**
 * Server-side rendering of the `core/post-categories` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-categories` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post categories for the current post wrapped inside "a" tags.
 */
function render_block_core_post_categories( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$post_categories = get_the_category( $block->context['postId'] );
	if ( empty( $post_categories ) ) {
		return '';
	}

	$align_class_name = empty( $attributes['textAlign'] ) ? '' : ' ' . "has-text-align-{$attributes['textAlign']}";

	$categoryLinks = '';
	foreach ( $post_categories as $category ) {
		$categoryLinks .= sprintf(
			'<a href="%1$s">%2$s</a> | ',
			get_category_link( $category->term_id ),
			esc_html( $category->name )
		);
	}
	$categoryLinks = trim( $categoryLinks, ' | ' );

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		'wp-block-post-categories' . esc_attr( $align_class_name ),
		$categoryLinks
	);
}

/**
 * Registers the `core/post-categories` block on the server.
 */
function register_block_core_post_categories() {
	register_block_type_from_metadata(
		__DIR__ . '/post-categories',
		array(
			'render_callback' => 'render_block_core_post_categories',
		)
	);
}
add_action( 'init', 'register_block_core_post_categories' );
