<?php
/**
 * Server-side rendering of the `core/post-title` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-title` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the filtered post title for the current post wrapped inside "h1" tags.
 */
function render_block_core_post_title( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$post_ID          = $block->context['postId'];
	$tag_name         = 'h2';
	$align_class_name = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";

	if ( isset( $attributes['level'] ) ) {
		$tag_name = 0 === $attributes['level'] ? 'p' : 'h' . $attributes['level'];
	}

	$title = get_the_title( $post_ID );
	if ( isset( $attributes['isLink'] ) && $attributes['isLink'] ) {
		$title = sprintf( '<a href="%1s" target="%2s" rel="%3s">%4s</a>', get_the_permalink( $post_ID ), $attributes['linkTarget'], $attributes['rel'], $title );
	}

	return sprintf(
		'<%1$s class="%2$s">%3$s</%1$s>',
		$tag_name,
		esc_attr( $align_class_name ),
		$title
	);
}

/**
 * Registers the `core/post-title` block on the server.
 */
function register_block_core_post_title() {
	register_block_type_from_metadata(
		__DIR__ . '/post-title',
		array(
			'api_version'     => 2,
			'render_callback' => 'render_block_core_post_title',
		)
	);
}
add_action( 'init', 'register_block_core_post_title' );
