<?php
/**
 * Slide Block.
 *
 * @package WordPress
 */

/**
 * Registers the `core/slide` block on the server.
 *
 * @since 7.0.0
 */
function register_block_core_slide() {
	register_block_type_from_metadata( __DIR__ . '/slide' );
}
add_action( 'init', 'register_block_core_slide' );
