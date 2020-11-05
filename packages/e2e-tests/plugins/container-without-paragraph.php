<?php
/**
 * Plugin Name: Gutenberg Test Container Block Without paragraph
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-container-without-paragraph
 */

/**
 * Registers a custom script for the plugin.
 */
function enqueue_container_without_paragraph_plugin_script() {
	wp_enqueue_script(
		'gutenberg-test-container-without-paragraph',
		plugins_url( 'container-without-paragraph/index.js', __FILE__ ),
		array(
			'wp-blocks',
			'wp-element',
			'wp-block-editor',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'container-without-paragraph/index.js' ),
		true
	);
}

add_action( 'init', 'enqueue_container_without_paragraph_plugin_script' );
