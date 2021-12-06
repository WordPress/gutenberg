<?php
/**
 * Server-side rendering of the `core/query-pagination-next` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/query-pagination-next` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the next posts link for the query pagination.
 */
function render_block_core_query_pagination_next( $attributes, $content, $block ) {
	$page_key = isset( $block->context['queryId'] ) ? 'query-' . $block->context['queryId'] . '-page' : 'query-page';
	$page     = empty( $_GET[ $page_key ] ) ? 1 : (int) $_GET[ $page_key ];
	$max_page = isset( $block->context['query']['pages'] ) ? (int) $block->context['query']['pages'] : 0;

	$wrapper_attributes = get_block_wrapper_attributes();
	$default_label      = __( 'Next Page' );
	$label              = isset( $attributes['label'] ) && ! empty( $attributes['label'] ) ? $attributes['label'] : $default_label;
	$pagination_arrow   = get_query_pagination_arrow( $block, true );
	$content            = '';

	if ( $pagination_arrow ) {
		$label .= $pagination_arrow;
	}

	// TODO: udpate below comment..
	// If we are in query's first page, render a hidden placeholder for...(design) purposes??
	$placholder_attributes = get_block_wrapper_attributes(
		array(
			'aria-hidden' => 'true',
			'style'       => 'visibility:hidden;',
		)
	);
	$placeholder           = sprintf(
		'<span %1$s>%2$s</span>',
		$placholder_attributes,
		$label
	);

	// Check if the pagination is for Query that inherits the global context.
	if ( isset( $block->context['query']['inherit'] ) && $block->context['query']['inherit'] ) {
		$filter_link_attributes = function() use ( $wrapper_attributes ) {
			return $wrapper_attributes;
		};
		add_filter( 'next_posts_link_attributes', $filter_link_attributes );
		// Take into account if we have set a bigger `max page`
		// than what the query has.
		global $wp_query;
		if ( $max_page > $wp_query->max_num_pages ) {
			$max_page = $wp_query->max_num_pages;
		}
		$content = get_next_posts_link( $label, $max_page );
		if ( empty( $content ) ) {
			// Return the placeholder content as we are in query's last page.
			$content = $placeholder;
		}
		remove_filter( 'next_posts_link_attributes', $filter_link_attributes );
		return $content;
	}
	// We have a custom query here.
	if ( ! $max_page || $max_page > $page ) {
		$custom_query = new WP_Query( build_query_vars_from_query_block( $block, $page ) );
		if ( (int) $custom_query->max_num_pages !== $page ) {
			$content = sprintf(
				'<a href="%1$s" %2$s>%3$s</a>',
				esc_url( add_query_arg( $page_key, $page + 1 ) ),
				$wrapper_attributes,
				$label
			);
		} else {
			// Return the placeholder content as we are in query's last page.
			$content = $placeholder;
		}
		wp_reset_postdata(); // Restore original Post Data.
	}
	return $content;
}

/**
 * Registers the `core/query-pagination-next` block on the server.
 */
function register_block_core_query_pagination_next() {
	register_block_type_from_metadata(
		__DIR__ . '/query-pagination-next',
		array(
			'render_callback' => 'render_block_core_query_pagination_next',
		)
	);
}
add_action( 'init', 'register_block_core_query_pagination_next' );
