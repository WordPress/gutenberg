<?php
/**
 * Server-side rendering of the `core/query-loop` block.
 *
 * @package WordPress
 */

/**
 * Registers the `core/query-loop` block on the server.
 */
function register_block_core_query_loop() {
	register_block_type_from_metadata(
		__DIR__ . '/query-loop'
	);
}
add_action( 'init', 'register_block_core_query_loop' );
