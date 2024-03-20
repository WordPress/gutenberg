<?php
/**
 * Block Bindings API
 *
 * Contains functions for managing block bindings in WordPress.
 *
 * @package WordPress
 * @subpackage Block Bindings
 * @since 6.5.0
 */

/**
 * Registers a new block bindings source.
 *
 * Sources are used to override block's original attributes with a value
 * coming from the source. Once a source is registered, it can be used by a
 * block by setting its `metadata.bindings` attribute to a value that refers
 * to the source.
 *
 * @since 6.5.0
 *
 * @param string $source_name       The name of the source. It must be a string containing a namespace prefix, i.e.
 *                                  `my-plugin/my-custom-source`. It must only contain lowercase alphanumeric
 *                                  characters, the forward slash `/` and dashes.
 * @param array  $source_properties {
 *     The array of arguments that are used to register a source.
 *
 *     @type string   $label                   The label of the source.
 *     @type callback $get_value_callback      A callback executed when the source is processed during block rendering.
 *                                             The callback should have the following signature:
 *
 *                                             `function ($source_args, $block_instance,$attribute_name): mixed`
 *                                                 - @param array    $source_args    Array containing source arguments
 *                                                                                   used to look up the override value,
 *                                                                                   i.e. {"key": "foo"}.
 *                                                 - @param WP_Block $block_instance The block instance.
 *                                                 - @param string   $attribute_name The name of an attribute .
 *                                             The callback has a mixed return type; it may return a string to override
 *                                             the block's original value, null, false to remove an attribute, etc.
 *     @type array    $uses_context (optional) Array of values to add to block `uses_context` needed by the source.
 * }
 * @return WP_Block_Bindings_Source|false Source when the registration was successful, or `false` on failure.
 */
if ( ! function_exists( 'register_block_bindings_source' ) ) {
	function register_block_bindings_source( string $source_name, array $source_properties ) {
		return WP_Block_Bindings_Registry::get_instance()->register( $source_name, $source_properties );
	}
}

/**
 * Unregisters a block bindings source.
 *
 * @since 6.5.0
 *
 * @param string $source_name Block bindings source name including namespace.
 * @return WP_Block_Bindings_Source|false The unregistred block bindings source on success and `false` otherwise.
 */
if ( ! function_exists( 'unregister_block_bindings_source' ) ) {
	function unregister_block_bindings_source( string $source_name ) {
		return WP_Block_Bindings_Registry::get_instance()->unregister( $source_name );
	}
}

/**
 * Retrieves the list of all registered block bindings sources.
 *
 * @since 6.5.0
 *
 * @return WP_Block_Bindings_Source The array of registered block bindings sources.
 */
if ( ! function_exists( 'get_all_registered_block_bindings_sources' ) ) {
	function get_all_registered_block_bindings_sources() {
		return WP_Block_Bindings_Registry::get_instance()->get_all_registered();
	}
}

/**
 * Retrieves a registered block bindings source.
 *
 * @since 6.5.0
 *
 * @param string $source_name The name of the source.
 * @return WP_Block_Bindings_Source|null The registered block bindings source, or `null` if it is not registered.
 */
if ( ! function_exists( 'get_block_bindings_source' ) ) {
	function get_block_bindings_source( string $source_name ) {
		return WP_Block_Bindings_Registry::get_instance()->get_registered( $source_name );
	}
}
