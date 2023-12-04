<?php
/**
 * Define the mechanism to add new sources available in the block bindings API.
 *
 * @package gutenberg
 */

global $block_bindings_sources;
$block_bindings_sources = array();
if ( ! function_exists( 'register_block_bindings_source' ) ) {
	/**
	 * Function to register a new source.
	 *
	 * @param string   $source_name The name of the source.
	 * @param function $source_callback The callback executed when the source is processed in the server.
	 */
	function register_block_bindings_source( $source_name, $source_callback ) {
		// We might want to add some validation here, for the name and for the apply_source callback.
		// To ensure the register sources are valid.
		global $block_bindings_sources;
		$block_bindings_sources[ $source_name ] = array( 'apply_source' => $source_callback );
	}
}
