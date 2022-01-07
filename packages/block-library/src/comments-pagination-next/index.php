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
 * @return string Returns the next comments link for the query pagination.
 */
function render_block_core_comments_pagination_next( $attributes, $content, $block ) {
	$per_page = ! empty( $block->context['comments/perPage'] ) ? (int) $block->context['comments/perPage'] : 0;
	if ( 0 === $per_page && get_option( 'page_comments' ) ) {
		$per_page = (int) get_query_var( 'comments_per_page' );
		if ( 0 === $per_page ) {
			$per_page = (int) get_option( 'comments_per_page' );
		}
	}
	$comments_number  = (int) get_comments_number();
	$max_page         = 0 !== $per_page ? (int) floor( $comments_number / $per_page ) : 0;
	$default_label    = __( 'Next Comments' );
	$label            = isset( $attributes['label'] ) && ! empty( $attributes['label'] ) ? $attributes['label'] : $default_label;
	$pagination_arrow = get_comments_pagination_arrow( $block, 'next' );

	$filter_link_attributes = function() {
		return get_block_wrapper_attributes();
	};
	add_filter( 'next_comments_link_attributes', $filter_link_attributes );

	if ( $pagination_arrow ) {
		$label .= $pagination_arrow;
	}

	$next_comments_link = get_next_comments_link( $label, $max_page );

	remove_filter( 'next_posts_link_attributes', $filter_link_attributes );

	if ( ! isset( $next_comments_link ) ) {
		return '';
	}
	return $next_comments_link;
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
