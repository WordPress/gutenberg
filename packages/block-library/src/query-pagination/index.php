<?php
/**
 * Server-side rendering of the `core/query-pagination` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/query-pagination` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the pagination for the query.
 */
function render_block_core_query_pagination( $attributes, $content, $block ) {
	$page_key = isset( $block->context['queryId'] ) ? 'query-' . $block->context['queryId'] . '-page' : 'query-page';
	$page     = empty( $_GET[ $page_key ] ) ? 1 : filter_var( $_GET[ $page_key ], FILTER_VALIDATE_INT );

	$content = '';
	if ( 1 !== $page ) {
		$content .= sprintf(
			'<div><a href="%s">%s</a></div>',
			esc_url( add_query_arg( $page_key, '2' === $page ? false : $page - 1 ) ),
			__( 'Previous', 'gutenberg' )
		);
	}
	if ( $page < ( isset( $block->context['query']['pages'] ) ? $block->context['query']['pages'] : 1 ) ) {
		$content .= sprintf(
			'<div><a href="%s">%s</a></div>',
			esc_url( add_query_arg( $page_key, $page + 1 ) ),
			__( 'Next', 'gutenberg' )
		);
	}
	return $content;
}

/**
 * Registers the `core/query-pagination` block on the server.
 */
function register_block_core_query_pagination() {
	register_block_type_from_metadata(
		__DIR__ . '/query-pagination',
		array(
			'render_callback' => 'render_block_core_query_pagination',
		)
	);
}
add_action( 'init', 'register_block_core_query_pagination' );
