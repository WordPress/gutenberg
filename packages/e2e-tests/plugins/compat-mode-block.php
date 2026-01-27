<?php
/**
 * Plugin Name: Gutenberg Test Compat Mode Block
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-compat-mode-block
 */

add_action(
	'init',
	static function () {
		// Register the working test block.
		wp_register_script(
			'compat-mode-block-editor',
			plugin_dir_url( __FILE__ ) . 'compat-mode-block/editor.js',
			array(
				'wp-blocks',
				'wp-block-editor',
				'wp-element',
			),
			filemtime( plugin_dir_path( __FILE__ ) . 'compat-mode-block/editor.js' )
		);
		register_block_type_from_metadata( __DIR__ . '/compat-mode-block' );

		// Register the error test block.
		wp_register_script(
			'compat-mode-error-block-editor',
			plugin_dir_url( __FILE__ ) . 'compat-mode-block/editor-error.js',
			array(
				'wp-blocks',
				'wp-block-editor',
				'wp-element',
			),
			filemtime( plugin_dir_path( __FILE__ ) . 'compat-mode-block/editor-error.js' )
		);
		register_block_type_from_metadata( __DIR__ . '/compat-mode-block/error-block.json' );

		// Register the crash test block (no iframeCompatMode support).
		wp_register_script(
			'crash-block-editor',
			plugin_dir_url( __FILE__ ) . 'compat-mode-block/editor-crash.js',
			array(
				'wp-blocks',
				'wp-block-editor',
				'wp-element',
			),
			filemtime( plugin_dir_path( __FILE__ ) . 'compat-mode-block/editor-crash.js' )
		);
		register_block_type_from_metadata( __DIR__ . '/compat-mode-block/crash-block.json' );
	}
);
