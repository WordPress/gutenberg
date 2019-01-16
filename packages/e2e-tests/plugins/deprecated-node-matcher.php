<?php
/**
 * Plugin Name: Gutenberg Test Deprecated Node Matcher
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-deprecated-node-matcher
 */

/**
 * Registers a custom script for the plugin.
 */
function enqueue_deprecated_node_matcher_plugin_script() {
	wp_enqueue_script(
		'gutenberg-test-deprecated-node-matcher',
		plugins_url( 'deprecated-node-matcher/index.js', __FILE__ ),
		array(
			'lodash',
			'wp-blocks',
			'wp-element',
			'wp-editor',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'deprecated-node-matcher/index.js' ),
		true
	);
}

add_action( 'init', 'enqueue_deprecated_node_matcher_plugin_script' );
