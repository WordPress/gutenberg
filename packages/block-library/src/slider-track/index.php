<?php
/**
 * Server-side registration for the `core/slider-track` block.
 *
 * @package WordPress
 */

/**
 * Registers the `core/slider-track` block on the server.
 */
function register_block_core_slider_track() {
	register_block_type_from_metadata(
		__DIR__ . '/slider-track'
	);
}
add_action( 'init', 'register_block_core_slider_track' );
