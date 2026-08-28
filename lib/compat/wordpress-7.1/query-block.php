<?php
/**
 * Temporary compatibility code for new functionalities/changes related to the query block.
 *
 * @package gutenberg
 */

/**
 * Filters the query loop block query vars to exclude the current post.
 *
 * @param array $query The current query vars.
 * @param WP_Block $block The block instance.
 *
 * @return array The modified query vars.
 */
function gutenberg_filter_query_block_exclude_current( $query, $block ) {
	if ( ! empty( $block->context['query']['excludeCurrent'] ) ) {
		$current_post_id = get_the_ID();
		if ( $current_post_id ) {
			$query['post__not_in'][] = $current_post_id;
		}
	}

	return $query;
}

add_filter( 'query_loop_block_query_vars', 'gutenberg_filter_query_block_exclude_current', 10, 2 );
