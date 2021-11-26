<?php
/**
 * Server-side rendering of the `core/comments-pagination-previous` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/comments-pagination-previous` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the previous posts link for the query pagination.
 */
function render_block_core_comments_pagination_previous( $attributes, $content, $block ) {
	$comments_per_page = isset( $block->context['queryPerPage'] ) ? $block->context['queryPerPage'] : 4;
	$comments_number   = (int) get_comments_number();
	$max_page          = (int) floor( $comments_number / $comments_per_page );

	$default_label    = __( 'Previous Comments' );
	$label            = isset( $attributes['label'] ) && ! empty( $attributes['label'] ) ? $attributes['label'] : $default_label;
	$pagination_arrow = get_query_pagination_arrow( $block, true );
	if ( $pagination_arrow ) {
		$label .= $pagination_arrow;
	}
	$previous_comments_link = get_previous_comments_link( $label, $max_page );

	$wrapper_attributes = get_block_wrapper_attributes();

	if ( ! isset( $previous_comments_link ) ) {
		return '';
	}

	return sprintf(
		'<div %1s>%2s</div>',
		$wrapper_attributes,
		$previous_comments_link
	);
}

/**
 * Registers the `core/comments-pagination-previous` block on the server.
 */
function register_block_core_comments_pagination_previous() {
	register_block_type_from_metadata(
		__DIR__ . '/comments-pagination-previous',
		array(
			'render_callback' => 'render_block_core_comments_pagination_previous',
		)
	);
}
add_action( 'init', 'register_block_core_comments_pagination_previous' );
