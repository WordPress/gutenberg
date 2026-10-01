<?php
/**
 * Temporary compatibility code for new functionalities/changes related to the query block.
 *
 * @package gutenberg
 */

/**
 * Sets the `paged` query var for the Query Loop block.
 *
 * `build_query_vars_from_query_block()` paginates custom queries with the
 * `offset` query var alone. `WP_Query` decides whether to prepend sticky posts
 * from `paged`, not `offset`, so without this every page is treated as the
 * first one and the sticky posts are relocated to the top of each page.
 *
 * Passing `paged` keeps `offset` in charge of the LIMIT (so the same posts are
 * returned as before) while letting `WP_Query` place the sticky posts only on
 * the first page, matching the main query and the REST API.
 *
 * Note: Backports into the `wp-includes/blocks.php` file, in the
 * `build_query_vars_from_query_block()` function.
 *
 * @param array    $query The query vars.
 * @param WP_Block $block Block instance.
 * @param int      $page  Current query's page.
 * @return array The modified query vars.
 */
function gutenberg_set_query_block_paged( $query, $block, $page ) {
	if (
		isset( $block->context['query']['perPage'] ) &&
		is_numeric( $block->context['query']['perPage'] )
	) {
		$query['paged'] = $page;
	}

	return $query;
}

add_filter( 'query_loop_block_query_vars', 'gutenberg_set_query_block_paged', 10, 3 );
