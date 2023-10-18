<?php
/**
 * Functions to expose the store of the WP_Interactivity_Initial_State class.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Merge data into the state with the given namespace.
 *
 * @param string $namespace Namespace.
 * @param array  $data      State to merge.
 *
 * @return array The current state for the given namespace.
 */
function wp_initial_state( $namespace, $data = null ) {
	if ( $data ) {
		WP_Interactivity_Initial_State::merge_state( $namespace, $data );
	}
	return WP_Interactivity_Initial_State::get_state( $namespace );
}

/**
 * Render the Interactivity API initial state in the frontend.
 */
add_action( 'wp_footer', array( 'WP_Interactivity_Initial_State', 'render' ), 8 );
