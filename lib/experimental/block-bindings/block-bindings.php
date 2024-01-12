<?php
/**
 * Block Bindings API
 *
 * This file contains functions for managing block bindings in WordPress.
 *
 * @since 6.5.0
 * @package WordPress
 * @subpackage Script Modules
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
 * @param string   $label The label of the source.
 * @param callable $apply The callback function to be executed with the source.
 * @return void
 */
if ( ! function_exists( 'wp_block_bindings_register_source' ) ) {
	function wp_block_bindings_register_source( $source_name, $label, $apply ) {
		wp_block_bindings()->register_source( $source_name, $label, $apply );
	}
}

/**
 * Retrieves the list of allowed blocks.
 *
 * @return array The list of allowed blocks.
 */
if ( ! function_exists( 'wp_block_bindings_get_allowed_blocks' ) ) {
	function wp_block_bindings_get_allowed_blocks() {
		return wp_block_bindings()->get_allowed_blocks();
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
