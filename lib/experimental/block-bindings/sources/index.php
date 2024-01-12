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
	 * @param string   $label The label of the source.
	 * @param callable(object, object, string): string $apply - The callback executed when the source is processed during block rendering.
	 *                        - object $source_attrs: Object containing source ID used to look up the override value, i.e. {"value": "{ID}"}.
	 *                        - object $block_instance: The block instance.
	 *                        - string $attribute_name: The name of an attribute used to retrieve an override value from the block context.
	 *                        The callable should return a string that will be used to override the block's original value.
	 *
	 *
	 * @return void
	 */
	function register_block_bindings_source( $source_name, $label, $apply ) {
		global $block_bindings_sources;
		$block_bindings_sources[ $source_name ] = array(
			'label' => $label,
			'apply' => $apply,
		);
	}
}
