<?php
/**
 * Plugin Name: Gutenberg Test Iframed Block
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-iframed-block
 */

add_action(
	'setup_theme',
	function() {
		add_theme_support( 'block-templates' );
	}
);

add_action(
	'init',
	function() {
		wp_register_script(
			'iframed-block-jquery-test',
			plugin_dir_url( __FILE__ ) . 'iframed-block/jquery.test.js',
			array( 'jquery' ),
			filemtime( plugin_dir_path( __FILE__ ) . 'iframed-block/jquery.test.js' )
		);
		wp_register_script(
			'iframed-block-editor',
			plugin_dir_url( __FILE__ ) . 'iframed-block/editor.js',
			array(
				'wp-blocks',
				'wp-block-editor',
				'wp-element',
				'wp-compose',
				'iframed-block-jquery-test',
			),
			filemtime( plugin_dir_path( __FILE__ ) . 'iframed-block/editor.js' )
		);
		wp_register_script(
			'iframed-block-script',
			plugin_dir_url( __FILE__ ) . 'iframed-block/script.js',
			array( 'iframed-block-jquery-test' ),
			filemtime( plugin_dir_path( __FILE__ ) . 'iframed-block/script.js' )
		);
		register_block_type_from_metadata( __DIR__ . '/iframed-block' );
	}
);
