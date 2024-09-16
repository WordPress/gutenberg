<?php
/**
 * Add date query to the query loop block.
 *
 * @package gutenberg
 */

/**
 * Filter the query loop block query vars.
 *
 * @param array  $query Query vars.
 * @param object $block Block data.
 *
 * @return array
 */
function gutenberg_filter_query_loop_block_query_vars( $query, $block ) {

	if ( ! empty( $block->context['query']['after'] ) || $block->context['query']['before'] ) {
		$query['date_query'] = array(
			array(
				'after'     => $block->context['query']['after'],
				'before'    => $block->context['query']['before'],
				'inclusive' => true,
			),
		);
	}

	return $query;
}
add_filter( 'query_loop_block_query_vars', 'gutenberg_filter_query_loop_block_query_vars', 10, 2 );

/**
 * Remove date query from REST API request if its empty.
 *
 * @param array $args    Query arguments.
 * @param array $request Request data.
 *
 * @return array
 */
function gutenberg_filter_rest_post_query( $args, $request ) {
	if ( empty( $request['after'] ) && empty( $request['before'] ) ) {
		unset( $args['date_query'] );
	}
	return $args;
}
add_filter( 'rest_post_query', 'gutenberg_filter_rest_post_query', 10, 2 );
