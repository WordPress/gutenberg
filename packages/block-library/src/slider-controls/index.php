<?php
/**
 * Server-side registration for the `core/slider-controls` block.
 *
 * @package WordPress
 */

/**
 * Registers the `core/slider-controls` block on the server.
 */
function register_block_core_slider_controls() {
	register_block_type_from_metadata(
		__DIR__ . '/slider-controls'
	);
}
add_action( 'init', 'register_block_core_slider_controls' );
