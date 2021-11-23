<?php
/**
 * Server-side rendering of the `core/query-pagination-previous` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/query-pagination-previous` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the previous posts link for the query.
 */
function render_block_core_query_pagination_previous( $attributes, $content, $block ) {
	$page_key = isset( $block->context['queryId'] ) ? 'query-' . $block->context['queryId'] . '-page' : 'query-page';
	$page     = empty( $_GET[ $page_key ] ) ? 1 : (int) $_GET[ $page_key ];
	$paged    = ( get_query_var( 'paged' ) ) ? get_query_var( 'paged' ) : 1;
	$max_page = isset( $block->context['query']['pages'] ) ? (int) $block->context['query']['pages'] : 0;

	$wrapper_attributes        = get_block_wrapper_attributes();
	$hidden_wrapper_attributes = get_block_wrapper_attributes( array( 'aria-hidden' => 'true' ) );
	$default_label             = __( 'Previous Page' );
	$label                     = isset( $attributes['label'] ) && ! empty( $attributes['label'] ) ? $attributes['label'] : $default_label;
	$pagination_arrow          = get_query_pagination_arrow( $block, false );
	
	if ( $pagination_arrow ) {
		$label = $pagination_arrow . $label;
	}
	// Check if the pagination is for Query that inherits the global context
	// and handle appropriately.
	if ( isset( $block->context['query']['inherit'] ) && $block->context['query']['inherit'] ) {
		global $wp_query;
		$max_page               = ! $max_page || $max_page > $wp_query->max_num_pages ? $wp_query->max_num_pages : $max_page;
		$filter_link_attributes = function() use ( $wrapper_attributes ) {
			return $wrapper_attributes;
		};

		add_filter( 'previous_posts_link_attributes', $filter_link_attributes );
		if ( 1 !== $paged ) {
			$content = get_previous_posts_link( $label );
		} else {
			// Prints the link only if there are pages to paginate.
			$content = $max_page > 1 ? sprintf(
				'<span %1$s>%2$s</span>',
				$hidden_wrapper_attributes,
				$label
			) : '';
		}
		remove_filter( 'previous_posts_link_attributes', $filter_link_attributes );
	} else {
		$content = ( 1 !== $page ) ? sprintf(
			'<a href="%1$s" %2$s>%3$s</a>',
			esc_url( add_query_arg( $page_key, $page - 1 ) ),
			$wrapper_attributes,
			$label
		) : sprintf(
			'<span %1$s>%2$s</span>',
			$hidden_wrapper_attributes,
			$label
		);

	}
	return $content;
}

/**
 * Registers the `core/query-pagination-previous` block on the server.
 */
function register_block_core_query_pagination_previous() {
	register_block_type_from_metadata(
		__DIR__ . '/query-pagination-previous',
		array(
			'render_callback' => 'render_block_core_query_pagination_previous',
		)
	);
}
add_action( 'init', 'register_block_core_query_pagination_previous' );
