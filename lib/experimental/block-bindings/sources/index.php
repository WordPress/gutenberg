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
	 * @param array    $source_args List of arguments for the block bindings source:
	 *                              - label: The label of the source.
	 *                              - apply: The callback executed when the source is processed, which happens when a block is being rendered.
	 *                                       @param {object} $source_attrs {"value": "{ID}"} Object containing source ID used to look up value.
	 *                                       @param {object} $block_instance The block instance.
	 *                                       @param {string} $attribute_name The name of an attribute used to retrieve override value from block context.
	 *                                       @return {string} A value that will be used to override the block's original value.
	 *
	 *
	 * @return void
	 */
	function register_block_bindings_source( $source_name, $source_args ) {
		global $block_bindings_sources;
		$block_bindings_sources[ $source_name ] = $source_args;
	}
}
