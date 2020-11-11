<?php
/**
 * Server-side rendering of the `core/post-hierarchical-terms` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-hierarchical-terms` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post hierarchical terms for the current post wrapped inside "a" tags.
 */
function render_block_core_post_hierarchical_terms( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) || ! isset( $attributes['term'] ) ) {
		return '';
	}

	$post_hierarchical_terms = get_the_terms( $block->context['postId'], $attributes['term'] );
	if ( empty( $post_hierarchical_terms ) ) {
		return '';
	}

	$align_class_name = empty( $attributes['textAlign'] ) ? '' : ' ' . "has-text-align-{$attributes['textAlign']}";

	$terms_links = '';
	foreach ( $post_hierarchical_terms as $term ) {
		$terms_links .= sprintf(
			'<a href="%1$s">%2$s</a> | ',
			get_term_link( $term->term_id ),
			esc_html( $term->name )
		);
	}
	$terms_links        = trim( $terms_links, ' | ' );
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $align_class_name ) );

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$terms_links
	);
}

/**
 * Registers the `core/post-hierarchical-terms` block on the server.
 */
function register_block_core_post_hierarchical_terms() {
	register_block_type_from_metadata(
		__DIR__ . '/post-hierarchical-terms',
		array(
			'render_callback' => 'render_block_core_post_hierarchical_terms',
		)
	);
}
add_action( 'init', 'register_block_core_post_hierarchical_terms' );
