<?php
/**
 * Plugin Name: Gutenberg Test Layout Allow Wrap
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-layout-allow-wrap
 */

/**
 * Registers a custom script for the plugin.
 */
function enqueue_layout_allow_wrap_plugin_script() {
	wp_enqueue_script(
		'gutenberg-test-layout-allow-wrap',
		plugins_url( 'layout-allow-wrap/index.js', __FILE__ ),
		array(
			'wp-blocks',
			'wp-element',
			'wp-block-editor',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'layout-allow-wrap/index.js' ),
		true
	);
}

add_action( 'init', 'enqueue_layout_allow_wrap_plugin_script' );
