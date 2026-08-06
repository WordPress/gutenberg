<?php
/**
 * Plugin Name: Gutenberg Test InnerBlocks Allowed Blocks
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-inner-blocks-allowed-blocks
 */

/**
 * Registers a custom script for the plugin.
 */
function enqueue_inner_blocks_allowed_blocks_script() {
	wp_enqueue_script(
		'gutenberg-test-inner-blocks-allowed-blocks',
		plugins_url( 'inner-blocks-allowed-blocks/index.js', __FILE__ ),
		array(
			'wp-blocks',
			'wp-block-editor',
			'wp-element',
			'wp-i18n',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'inner-blocks-allowed-blocks/index.js' ),
		true
	);
}
add_action( 'enqueue_block_assets', 'enqueue_inner_blocks_allowed_blocks_script' );
