<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Autocomplete Component
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-plugin-autocomplete-component
 */

/**
 * Registers a sidebar with a plain contenteditable wired to the Autocomplete
 * component.
 */
function enqueue_autocomplete_component_plugin_script() {
	wp_enqueue_script(
		'gutenberg-test-autocomplete-component',
		plugins_url( 'autocomplete-component/index.js', __FILE__ ),
		array(
			'wp-components',
			'wp-editor',
			'wp-element',
			'wp-plugins',
			'wp-rich-text',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'autocomplete-component/index.js' ),
		true
	);
}

add_action( 'enqueue_block_editor_assets', 'enqueue_autocomplete_component_plugin_script' );
