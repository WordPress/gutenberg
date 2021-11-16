<?php
/**
 * Server-side rendering of the `core/comments-pagination-next` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/comments-pagination-next` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the next posts link for the query pagination.
 */
function render_block_core_comments_pagination_next( $attributes, $content, $block ) {
	$comments_per_page = isset( $block->context['queryPerPage'] ) ? $block->context['queryPerPage'] : 4;
	$comments_number   = (int) get_comments_number();
	$max_page          = (int) floor( $comments_number / $comments_per_page );

	$default_label    = __( 'Next Comments' );
	$label            = isset( $attributes['label'] ) && ! empty( $attributes['label'] ) ? $attributes['label'] : $default_label;
	$pagination_arrow = get_query_pagination_arrow( $block, true );
	if ( $pagination_arrow ) {
		$label .= $pagination_arrow;
	}
	$next_comments_link = get_next_comments_link( $label, $max_page );

	$wrapper_attributes = get_block_wrapper_attributes();

	if ( ! isset( $next_comments_link ) ) {
		return '';
	}

	return sprintf(
		'<div %1s>%2s</div>',
		$wrapper_attributes,
		$next_comments_link
	);
}

/**
 * Registers the `core/comments-pagination-next` block on the server.
 */
function register_block_core_comments_pagination_next() {
	register_block_type_from_metadata(
		__DIR__ . '/comments-pagination-next',
		array(
			'render_callback' => 'render_block_core_comments_pagination_next',
		)
	);
}
add_action( 'init', 'register_block_core_comments_pagination_next' );
