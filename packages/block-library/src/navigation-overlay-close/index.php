<?php
/**
 * Server-side registering of the `core/navigation-overlay-close` block.
 *
 * @package WordPress
 */

/**
 * Registers the navigation overlay close block.
 *
 * @since 7.0.0
 */
function register_block_core_navigation_overlay_close() {
	register_block_type_from_metadata(
		__DIR__ . '/navigation-overlay-close'
	);
}
add_action( 'init', 'register_block_core_navigation_overlay_close' );
