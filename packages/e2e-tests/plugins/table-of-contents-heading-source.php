<?php
/**
 * Plugin Name: Gutenberg Test Table of Contents Heading Source
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-table-of-contents-heading-source
 */

/**
 * Enqueues the test block used by Table of Contents e2e coverage in the block editor.
 */
function gutenberg_test_table_of_contents_heading_source_enqueue() {
	wp_enqueue_script(
		'gutenberg-test-table-of-contents-heading-source',
		plugins_url( 'table-of-contents-heading-source/index.js', __FILE__ ),
		array(
			'wp-blocks',
			'wp-block-editor',
			'wp-element',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'table-of-contents-heading-source/index.js' ),
		true
	);
}

add_action( 'enqueue_block_editor_assets', 'gutenberg_test_table_of_contents_heading_source_enqueue' );
