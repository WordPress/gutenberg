<?php
/**
 * Block Bindings API
 *
 * @since 6.5.0
 *
 * @package WordPress
 * @subpackage Script Modules
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

if ( ! function_exists( 'wp_block_bindings_register_source' ) ) {
	function wp_block_bindings_register_source( $source_name, $label, $apply ) {
		wp_block_bindings()->register_source( $source_name, $label, $apply );
	}
}

if ( ! function_exists( 'wp_block_bindings_get_allowed_blocks' ) ) {
	function wp_block_bindings_get_allowed_blocks() {
		return wp_block_bindings()->get_allowed_blocks();
	}
}

if ( ! function_exists( 'wp_block_bindings_get_sources' ) ) {
	function wp_block_bindings_get_sources() {
		return wp_block_bindings()->get_sources();
	}
}

if ( ! function_exists( 'wp_block_bindings_replace_html' ) ) {
	function wp_block_bindings_replace_html( $block_content, $block_name, $block_attr, $source_value ) {
		wp_block_bindings()->replace_html( $block_content, $block_name, $block_attr, $source_value );
	}
}
