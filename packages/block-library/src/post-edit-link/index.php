<?php
/**
 * Server-side rendering of the `core/post-edit-link` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-edit-link` block on the server.
 *
 * @since 6.0.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Return the post post's date.
 */
function render_block_core_post_edit_link( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) || ! current_user_can( 'edit_post', $block->context['postId'] ) ) {
		return '';
	}

	$edit_post_link = get_edit_post_link( $block->context['postId'] );

	$link_atts = '';

	if ( ! empty( $attributes['linkTarget'] ) ) {
		$link_atts .= sprintf( 'target="%s"', esc_attr( $attributes['linkTarget'] ) );
	}

	$classes = array();
	if ( isset( $attributes['textAlign'] ) ) {
		$classes[] = 'has-text-align-' . $attributes['textAlign'];
	}
	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classes[] = 'has-link-color';
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => implode( ' ', $classes ) ) );

	return sprintf(
		'<div %1$s><a href="%2$s" %3$s>%4$s</a></div>',
		$wrapper_attributes,
		esc_url( $edit_post_link ),
		$link_atts,
		esc_html__( 'Edit' )
	);
}

/**
 * Registers the `core/post-edit-link` block on the server.
 *
 * @since 6.0.0
 */
function register_block_core_post_edit_link() {
	register_block_type_from_metadata(
		__DIR__ . '/post-edit-link',
		array(
			'render_callback' => 'render_block_core_post_edit_link',
		)
	);
}

add_action( 'init', 'register_block_core_post_edit_link' );
