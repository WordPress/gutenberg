<?php
/**
 * Utils to optimize the interactive scripts.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Move interactive scripts to the footer and make them load with the defer strategy.
 * This ensures they work with `wp_store`.
 */
function gutenberg_interactivity_move_interactive_scripts_to_the_footer() {
	// Move the @wordpress/interactivity package to the footer.
	wp_script_add_data( 'wp-interactivity', 'group', 1 );
	wp_script_add_data( 'wp-interactivity', 'strategy', 'defer' );

	// Move all the view scripts of the interactive blocks to the footer.
	$registered_blocks = \WP_Block_Type_Registry::get_instance()->get_all_registered();
	foreach ( array_values( $registered_blocks ) as $block ) {
		if ( isset( $block->supports['interactivity'] ) && $block->supports['interactivity'] ) {
			foreach ( $block->view_script_handles as $handle ) {
				wp_script_add_data( $handle, 'group', 1 );
				wp_script_add_data( $handle, 'strategy', 'defer' );
			}
		}
	}
}
add_action( 'wp_enqueue_scripts', 'gutenberg_interactivity_move_interactive_scripts_to_the_footer', 11 );
