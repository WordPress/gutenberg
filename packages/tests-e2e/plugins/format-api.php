<?php
/**
 * Plugin Name: Gutenberg Test Format API
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-format-api
 */

/**
 * Enqueue plugin JavaScript for the editor
 */
function gutenberg_test_format_api_scripts() {
	wp_enqueue_script(
		'gutenberg-test-format-api',
		plugins_url( 'format-api/index.js', __FILE__ ),
		array( 'wp-editor', 'wp-element', 'wp-rich-text' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'format-api/index.js' ),
		true
	);
}

add_action( 'enqueue_block_editor_assets', 'gutenberg_test_format_api_scripts' );
