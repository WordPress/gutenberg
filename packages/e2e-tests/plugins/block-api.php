<?php
/**
 * Plugin Name: Gutenberg Test Block API
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-block-api
 */

/**
 * Registers a custom script for the plugin.
 */
function enqueue_block_api_plugin_script() {
	wp_enqueue_script(
		'gutenberg-test-block-api',
		plugins_url( 'block-api/index.js', __FILE__ ),
		array(
			'wp-blocks',
			'wp-hooks',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'block-api/index.js' ),
		true
	);
}

add_action( 'init', 'enqueue_block_api_plugin_script' );
