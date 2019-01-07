<?php
/**
 * Plugin Name: Gutenberg Test Meta Attribute Block
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-meta-attribute-block
 */

/**
 * Registers a custom script and a custom meta for the plugin.
 */
function init_test_meta_attribute_block_plugin() {
	wp_enqueue_script(
		'gutenberg-test-meta-attribute-block',
		plugins_url( 'meta-attribute-block/index.js', __FILE__ ),
		array(
			'wp-blocks',
			'wp-element',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'meta-attribute-block/index.js' ),
		true
	);

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
