<?php
/**
 * Server-side rendering of the `core/post-comment` block.
 *
 * @package WordPress
 */

/**
 * Registers the `core/post-comment` block on the server.
 * We need to do this to make context available for inner blocks.
 */
function register_block_core_post_comment() {
	register_block_type_from_metadata(
		__DIR__ . '/post-comment',
		array(
			'api_version' => 2,
		)
	);
}
add_action( 'init', 'register_block_core_post_comment' );
