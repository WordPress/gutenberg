<?php
/**
 * Plugin Name: Gutenberg Test React 18 Compat Block
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-react-18-compat-block
 */

add_action(
	'init',
	static function () {
		wp_register_script(
			'react-18-compat-block-editor',
			plugin_dir_url( __FILE__ ) . 'react-18-compat-block/editor.js',
			array(
				'wp-blocks',
				'wp-block-editor',
				'wp-element',
				'react',
				'react-jsx-runtime',
			),
			filemtime( plugin_dir_path( __FILE__ ) . 'react-18-compat-block/editor.js' )
		);
		register_block_type_from_metadata( __DIR__ . '/react-18-compat-block' );
	}
);
