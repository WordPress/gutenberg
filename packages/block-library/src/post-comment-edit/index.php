<?php
/**
 * Server-side rendering of the `core/post-comment-edit` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-comment-edit` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Return the post comment's date.
 */
function render_block_core_post_comment_edit( $attributes, $content, $block ) {
	if ( ! isset( $block->context['commentId'] ) || ! current_user_can( 'edit_comment', $block->context['commentId'] ) ) {
		return '';
	}


	$edit_comment_link = get_edit_comment_link( $block->context['commentId'] );
	$open_in_new_tab   = $attributes['openInNewTab'] === true;

	$link_atts = '';

	if ( $open_in_new_tab ) {
		$link_atts .= 'target="_blank"';
	}

	return sprintf(
		'<div %1$s><a href=%2$s %3$s>%4$s</a></div>',
		get_block_wrapper_attributes(),
		esc_url( $edit_comment_link ),
		$link_atts,
		esc_html__( 'Edit' )
	);
}

/**
 * Registers the `core/post-comment-edit` block on the server.
 */
function register_block_core_post_comment_edit() {
	register_block_type_from_metadata(
		__DIR__ . '/post-comment-edit',
		[
			'render_callback' => 'render_block_core_post_comment_edit',
		]
	);
}

add_action( 'init', 'register_block_core_post_comment_edit' );
