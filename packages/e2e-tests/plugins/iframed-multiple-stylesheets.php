<?php
/**
 * Plugin Name: Gutenberg Test Iframed Multiple Stylesheets
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-iframed-multiple-stylesheets
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
			'iframed-multiple-stylesheets-editor-script',
			plugin_dir_url( __FILE__ ) . 'iframed-multiple-stylesheets/editor.js',
			array(
				'wp-blocks',
				'wp-block-editor',
				'wp-element',
			),
			filemtime( plugin_dir_path( __FILE__ ) . 'iframed-multiple-stylesheets/editor.js' )
		);
		wp_register_style(
			'iframed-multiple-stylesheets-style',
			plugin_dir_url( __FILE__ ) . 'iframed-multiple-stylesheets/style.css',
			array(),
			filemtime( plugin_dir_path( __FILE__ ) . 'iframed-multiple-stylesheets/style.css' )
		);
		wp_register_style(
			'iframed-multiple-stylesheets-style2',
			plugin_dir_url( __FILE__ ) . 'iframed-multiple-stylesheets/style2.css',
			array(),
			filemtime( plugin_dir_path( __FILE__ ) . 'iframed-multiple-stylesheets/style2.css' )
		);
		register_block_type_from_metadata( __DIR__ . '/iframed-multiple-stylesheets' );
	}
);
