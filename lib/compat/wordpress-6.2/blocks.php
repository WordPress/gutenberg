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
	// Use a static var to cache the results of the query.
	static $cached_queries = array();
	// Use a hash of the query args as the cache key.
	$cache_key = md5( wp_json_encode( $query_args ) );

	// If the query hasn't been cached, run it and cache the results.
	if ( empty( $cached_queries[ $cache_key ] ) ) {
		$query                        = new WP_Query( $query_args );
		$cached_queries[ $cache_key ] = $query;
	}
	return $cached_queries[ $cache_key ];
}
