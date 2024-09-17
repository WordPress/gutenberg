<?php
/**
 * Plugin Name: Gutenberg Test Iframed Masonry Block
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-iframed-masonry-block
 */

add_action(
	'init',
	static function () {
		wp_register_script(
			'iframed-masonry-block-editor',
			plugin_dir_url( __FILE__ ) . 'iframed-masonry-block/editor.js',
			array(
				'wp-blocks',
				'wp-block-editor',
				'wp-element',
				'wp-compose',
				'masonry',
			),
			filemtime( plugin_dir_path( __FILE__ ) . 'iframed-masonry-block/editor.js' )
		);
		wp_register_script(
			'iframed-masonry-block-script',
			plugin_dir_url( __FILE__ ) . 'iframed-masonry-block/script.js',
			array( 'masonry' ),
			filemtime( plugin_dir_path( __FILE__ ) . 'iframed-masonry-block/script.js' )
		);
		register_block_type_from_metadata( __DIR__ . '/iframed-masonry-block' );
	}
);
