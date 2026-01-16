<?php
/**
 * Slide block.
 *
 * @package WordPress
 */

/**
 * Registers the `core/slide` block on the server.
 */
function register_block_core_slide() {
	register_block_type_from_metadata(
		__DIR__ . '/slide'
	);
}
add_action( 'init', 'register_block_core_slide' );
