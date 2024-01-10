<?php
/**
 * Functions to expose the store of the WP_Interactivity_Initial_State class.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

if ( ! function_exists( 'wp_initial_state' ) ) {
	/**
	 * Merge data into the state with the given namespace.
	 *
	 * @param string $store_ns  Namespace.
	 * @param array  $data      State to merge.
	 *
	 * @return array The current state for the given namespace.
	 */
	function wp_initial_state( $store_ns, $data = null ) {
		if ( $data ) {
			WP_Interactivity_Initial_State::merge_state( $store_ns, $data );
		}
		return WP_Interactivity_Initial_State::get_state( $store_ns );
	}

	/**
	 * Render the Interactivity API initial state in the frontend.
	 */
	add_action( 'wp_footer', array( 'WP_Interactivity_Initial_State', 'render' ), 8 );
}
