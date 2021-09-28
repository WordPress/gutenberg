<?php
/**
 * Plugin Name: Gutenberg Test Custom Grouping Block
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-custom-grouping-block
 */

/**
 * Registers a custom script for the plugin.
 */
function enqueue_custom_grouping_block_plugin_script() {
	wp_enqueue_script(
		'gutenberg-test-custom-grouping-block',
		plugins_url( 'custom-grouping-block/index.js', __FILE__ ),
		array(
			'wp-blocks',
			'wp-element',
			'wp-block-editor',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'custom-grouping-block/index.js' ),
		true
	);
}

add_action( 'init', 'enqueue_custom_grouping_block_plugin_script' );
