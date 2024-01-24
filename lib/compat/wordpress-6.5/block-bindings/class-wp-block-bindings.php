<?php
/**
 * Block Bindings API: WP_Block_Bindings class.
 *
 * Support for overriding content in blocks by connecting them to different sources.
 *
 * @since 17.6.0
 * @package gutenberg
 */

if ( class_exists( 'WP_Block_Bindings' ) ) {
	return;
}

/**
 * Core class used to define supported blocks, register sources, and populate HTML with content from those sources.
 */
class WP_Block_Bindings {

	/**
	 * Holds the registered block bindings sources, keyed by source identifier.
	 *
	 * @var array
	 */
	private $sources = array();

	/**
	 * Function to register a new block binding source.
	 *
	 * Sources are used to override block's original attributes with a value
	 * coming from the source. Once a source is registered, it can be used by a
	 * block by setting its `metadata.bindings` attribute to a value that refers
	 * to the source.
	 *
	 * @param string   $source_name             The name of the source.
	 * @param array    $source_properties       The array of arguments that are used to register a source. The array has two elements:
	 *                                           1. string   $label        The label of the source.
	 *                                           2. callback $apply        A callback
	 *                                           executed when the source is processed during
	 *                                           block rendering. The callback should have the
	 *                                           following signature:
	 *
	 *                                             `function (object $source_attrs, object $block_instance, string $attribute_name): string`
	 *                                                     - @param object $source_attrs: Object containing source ID used to look up the override value, i.e. {"value": "{ID}"}.
	 *                                                     - @param object $block_instance: The block instance.
	 *                                                     - @param string $attribute_name: The name of an attribute used to retrieve an override value from the block context.
	 *                                            The callback should return a string that will be used to override the block's original value.
	 *
	 * @return void
	 */
	public function register_source( $source_name, array $source_properties ) {
			$this->sources[ $source_name ] = $source_properties;
	}

	/**
	 * Retrieves the list of registered block sources.
	 *
	 * @return array The array of registered sources.
	 */
	public function get_sources() {
		return $this->sources;
	}
}
