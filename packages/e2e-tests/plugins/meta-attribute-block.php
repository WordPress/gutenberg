<?php
/**
 * Plugin Name: Gutenberg Test Meta Attribute Block
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-meta-attribute-block
 */

/**
 * Registers a custom meta for use by the test block.
 */
function init_test_meta_attribute_block_plugin() {
	register_meta(
		'post',
		'my_meta',
		array(
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
		)
	);
}

add_action( 'init', 'init_test_meta_attribute_block_plugin' );

/**
 * Enqueues block assets for the custom meta test block.
 */
function enqueue_test_meta_attribute_block() {
	wp_enqueue_script(
		'gutenberg-test-meta-attribute-block-early',
		plugins_url( 'meta-attribute-block/early.js', __FILE__ ),
		array(
			'wp-blocks',
			'wp-element',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'meta-attribute-block/early.js' )
	);

	wp_enqueue_script(
		'gutenberg-test-meta-attribute-block-late',
		plugins_url( 'meta-attribute-block/late.js', __FILE__ ),
		array(
			'wp-blocks',
			'wp-element',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'meta-attribute-block/late.js' ),
		true
	);
}
add_action( 'enqueue_block_assets', 'enqueue_test_meta_attribute_block' );
