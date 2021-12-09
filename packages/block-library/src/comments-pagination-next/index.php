<?php
/**
 * Server-side rendering of the `core/comments-pagination-next` block.
 *
 * @package WordPress
 */


/**
 * Applies the block attributes to the block markup without using a wrapper.
 *
 * @return string Returns the styles and classes defined on the block editor for the block.
 */
function add_next_comments_link_attributes() {
	if ( ! function_exists( 'get_block_wrapper_attributes' ) ) {
		return;
	}
	return get_block_wrapper_attributes();
}
add_filter( 'next_comments_link_attributes', 'add_next_comments_link_attributes' );

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
	$comments_per_page = $block->context['queryPerPage'];
	$comments_number   = (int) get_comments_number();
	$max_page          = isset( $comments_per_page ) ? (int) floor( $comments_number / $comments_per_page ) : 0;
	$default_label     = __( 'Next Comments' );
	$label             = isset( $attributes['label'] ) && ! empty( $attributes['label'] ) ? $attributes['label'] : $default_label;
	$pagination_arrow  = get_query_pagination_arrow( $block, true );
	if ( $pagination_arrow ) {
		$label .= $pagination_arrow;
	}
	$next_comments_link = get_next_comments_link( $label, $max_page );

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
