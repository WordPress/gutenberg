<?php
/**
 * Plugin Name: Gutenberg Test Autocompleter
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-autocompleter
 */

/**
 * Registers a custom script for the plugin.
 */
function enqueue_test_autocompleter_plugin_script() {
	wp_enqueue_script(
		'gutenberg-test-autocompleter',
		plugins_url( 'test-autocompleter/index.js', __FILE__ ),
		array(
			'wp-hooks',
			'wp-element',
			'wp-block-editor',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'test-autocompleter/index.js' ),
		false
	);
}

add_action( 'init', 'enqueue_test_autocompleter_plugin_script' );
