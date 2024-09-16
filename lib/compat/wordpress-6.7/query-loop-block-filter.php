<?php
/**
 * Add date query support to query loop block.
 *
 * @package gutenberg
 */
function gutenberg_filter_query_loop_block_query_vars( $query, $block ) {

	if ( ! empty( $block->context['query']['after'] ) || $block->context['query']['before'] ) {
		$query['date_query'] = [
			[
				'after'     => $block->context['query']['after'],
				'before'    => $block->context['query']['before'],
				'inclusive' => true,
			],
		];
	}

	return $query;
}
add_filter( 'query_loop_block_query_vars', 'gutenberg_filter_query_loop_block_query_vars', 10, 2 );

function gutenberg_filter_rest_post_query(  $args, $request ) {
	if ( empty( $request['after'] ) && empty( $request['before'] ) ) {
		unset( $args['date_query'] );
	}
	return $args;
}
add_filter( 'rest_post_query', 'gutenberg_filter_rest_post_query', 10, 2 );
