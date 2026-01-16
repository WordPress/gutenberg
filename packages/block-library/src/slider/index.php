<?php
/**
 * Server-side registration for the `core/slider` block.
 *
 * @package WordPress
 */

/**
 * Registers the `core/slider` block on the server.
 */
function register_block_core_slider() {
	register_block_type_from_metadata(
		__DIR__ . '/slider'
	);
}
add_action( 'init', 'register_block_core_slider' );
