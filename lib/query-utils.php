<?php
/**
 * Utility functions used for handling Query block and blocks
 * that
 *
 * @package gutenberg
 */

/**
 * Helper function that constructs a WP_Query args object from
 * a `Query` block properties.
 *
 * It's used in QueryLoop, QueryPaginationNumbers and QueryPaginationNext blocks.
 *
 * @param WP_Block $block Block instance.
 * @param int      $page  Curren query's page.
 *
 * @return object Returns the constructed WP_Query object.
 */
function construct_wp_query_args( $block, $page ) {
	$query = array(
		'post_type'    => 'post',
		'order'        => 'DESC',
		'orderby'      => 'date',
		'post__not_in' => array(),
	);

	if ( isset( $block->context['query'] ) ) {
		if ( isset( $block->context['query']['postType'] ) ) {
			$query['post_type'] = $block->context['query']['postType'];
		}
		if ( isset( $block->context['query']['sticky'] ) && ! empty( $block->context['query']['sticky'] ) ) {
			$sticky = get_option( 'sticky_posts' );
			if ( 'only' === $block->context['query']['sticky'] ) {
				$query['post__in'] = $sticky;
			} else {
				$query['post__not_in'] = array_merge( $query['post__not_in'], $sticky );
			}
		}
		if ( isset( $block->context['query']['exclude'] ) ) {
			$query['post__not_in'] = array_merge( $query['post__not_in'], $block->context['query']['exclude'] );
		}
		if ( isset( $block->context['query']['perPage'] ) ) {
			$query['offset']         = ( $block->context['query']['perPage'] * ( $page - 1 ) ) + $block->context['query']['offset'];
			$query['posts_per_page'] = $block->context['query']['perPage'];
		}
		if ( isset( $block->context['query']['categoryIds'] ) ) {
			$query['category__in'] = $block->context['query']['categoryIds'];
		}
		if ( isset( $block->context['query']['tagIds'] ) ) {
			$query['tag__in'] = $block->context['query']['tagIds'];
		}
		if ( isset( $block->context['query']['order'] ) ) {
			$query['order'] = strtoupper( $block->context['query']['order'] );
		}
		if ( isset( $block->context['query']['orderBy'] ) ) {
			$query['orderby'] = $block->context['query']['orderBy'];
		}
		if ( isset( $block->context['query']['author'] ) ) {
			$query['author'] = $block->context['query']['author'];
		}
		if ( isset( $block->context['query']['search'] ) ) {
			$query['s'] = $block->context['query']['search'];
		}
	}
	return $query;
}
