<?php
/**
 * Server-side registration of the `core/post` block.
 *
 * @package WordPress
 */

/**
 * Registers the `core/post` block on the server.
 */
function register_block_core_post() {
	$path     = __DIR__ . '/post/block.json';
	$metadata = json_decode( file_get_contents( $path ), true );
	register_block_type(
		$metadata['name'],
		$metadata
	);
}
add_action( 'init', 'register_block_core_post' );
