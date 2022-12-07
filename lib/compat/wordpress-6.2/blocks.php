<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Get the results of a block query.
 *
 * This is a simple wrapper around `WP_Query` that allows us to
 * cache the results of a query, and avoid repeat calls to the same query,
 * which can be expensive.
 *
 * @param array $query_args Query arguments.
 * @return WP_Query
 */
function _gutenberg_get_cached_block_query_results( $query_args ) {
	$cache_key = 'query_results_' . md5( wp_json_encode( $query_args ) );
	$results   = wp_cache_get( $cache_key, 'block-queries' );
	if ( false === $results ) {
		$query   = new WP_Query( $query_args );
		$results = $query->posts;
		wp_cache_set( $cache_key, $results, 'block-queries' );
	}
	return $results;
}
