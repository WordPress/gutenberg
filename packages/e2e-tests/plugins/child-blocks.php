<?php
/**
 * Plugin Name: Gutenberg Test Child Blocks
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-child-blocks
 */

/**
 * Registers a custom script for the plugin.
 */
function enqueue_child_blocks_script() {
	wp_enqueue_script(
		'gutenberg-test-child-blocks',
		plugins_url( 'child-blocks/index.js', __FILE__ ),
		array(
			'wp-blocks',
			'wp-block-editor',
			'wp-element',
			'wp-i18n',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'child-blocks/index.js' ),
		true
	);
}

add_action( 'init', 'enqueue_child_blocks_script' );
