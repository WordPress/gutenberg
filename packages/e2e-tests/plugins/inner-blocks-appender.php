<?php
/**
 * Plugin Name: Gutenberg Test InnerBlocks Appender
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-inner-blocks-appender
 */

/**
 * Registers a custom script for the plugin.
 */
function enqueue_inner_blocks_appender_script() {
	wp_enqueue_script(
		'gutenberg-test-inner-blocks-appender',
		plugins_url( 'inner-blocks-appender/index.js', __FILE__ ),
		array(
			'wp-blocks',
			'wp-block-editor',
			'wp-element',
			'wp-i18n',
			'wp-data',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'inner-blocks-appender/index.js' ),
		true
	);
}

add_action( 'init', 'enqueue_inner_blocks_appender_script' );
