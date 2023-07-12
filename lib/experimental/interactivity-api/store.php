<?php
/**
 * Functions to expose the store of the WP_Interactivity_Store class.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Merge data with the existing store.
 *
 * @param array $data Data that will be merged with the existing store.
 *
 * @return $data The current store data.
 */
function wp_store( $data = null ) {
	if ( $data ) {
		WP_Interactivity_Store::merge_data( $data );
	}
	return WP_Interactivity_Store::get_data();
}

/**
 * Render the Interactivity API store in the frontend.
 */
add_action( 'wp_footer', array( 'WP_Interactivity_Store', 'render' ), 8 );
