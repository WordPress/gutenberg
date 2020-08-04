<?php
/**
 * Plugin Name: Gutenberg Test InnerBlocks Locking All Embed
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-inner-blocks-locking-all-embed
 */

/**
 * Registers a custom script for the plugin.
 */
function enqueue_container_without_paragraph_plugin_script() {
	wp_enqueue_script(
		'gutenberg-test-inner-blocks-locking-all-embed',
		plugins_url( 'inner-blocks-locking-all-embed/index.js', __FILE__ ),
		array(
			'wp-blocks',
			'wp-element',
			'wp-block-editor',
			'wp-i18n',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'inner-blocks-locking-all-embed/index.js' ),
		true
	);
}

add_action( 'init', 'enqueue_container_without_paragraph_plugin_script' );
