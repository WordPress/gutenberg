<?php
/**
 * Block Bindings API
 *
 * This file contains functions for managing block bindings in WordPress.
 *
 * @since 17.6.0
 * @package gutenberg
 */

/**
 * Retrieves the singleton instance of WP_Block_Bindings.
 *
 * @return WP_Block_Bindings The WP_Block_Bindings instance.
 */
if ( ! function_exists( 'wp_block_bindings' ) ) {
	function wp_block_bindings() {
		static $instance = null;
		if ( is_null( $instance ) ) {
			$instance = new WP_Block_Bindings();
		}
		return $instance;
	}
}

/**
 * Registers a new source for block bindings.
 *
 * @param string   $source_name The name of the source.
 * @param array    $source_args   The array of arguments that are used to register a source. The array has two elements:
 *                                1. string   $label        The label of the source.
 *                                2. callback $apply        A callback
 *                                executed when the source is processed during
 *                                block rendering. The callback should have the
 *                                following signature:
 *
 *                                  `function (object $source_attrs, object $block_instance, string $attribute_name): string`
 *                                          - @param object $source_attrs: Object containing source ID used to look up the override value, i.e. {"value": "{ID}"}.
 *                                          - @param object $block_instance: The block instance.
 *                                          - @param string $attribute_name: The name of an attribute used to retrieve an override value from the block context.
 *                                 The callback should return a string that will be used to override the block's original value.
 *
 * @return void
 */
if ( ! function_exists( 'wp_block_bindings_register_source' ) ) {
	function wp_block_bindings_register_source( $source_name, array $source_args ) {
		wp_block_bindings()->register_source( $source_name, $source_args );
	}
}

/**
 * Retrieves the list of registered block sources.
 *
 * @return array The list of registered block sources.
 */
if ( ! function_exists( 'wp_block_bindings_get_sources' ) ) {
	function wp_block_bindings_get_sources() {
		return wp_block_bindings()->get_sources();
	}
}

/**
 * Replaces the HTML content of a block based on the provided source value.
 *
 * @param string $block_content Block Content.
 * @param string $block_name The name of the block to process.
 * @param string $block_attr The attribute of the block we want to process.
 * @param string $source_value The value used to replace the HTML.
 * @return string The modified block content.
 */
if ( ! function_exists( 'wp_block_bindings_replace_html' ) ) {
	function wp_block_bindings_replace_html( $block_content, $block_name, $block_attr, $source_value ) {
		return wp_block_bindings()->replace_html( $block_content, $block_name, $block_attr, $source_value );
	}
}
