<?php
/**
 * Plugin Name: Gutenberg Test Iframed Editor Style
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-iframed-add-editor-style
 */

// Enable the template editor to test the iframed content.
add_action(
	'setup_theme',
	function() {
		add_theme_support( 'block-templates' );
	}
);

add_filter(
	'block_editor_settings_all',
	function( $settings ) {
		wp_register_style(
			'my-theme-stylesheet',
			plugin_dir_url( __FILE__ ) . 'iframed-editor-style/style.css',
			array(),
			filemtime( plugin_dir_path( __FILE__ ) . 'iframed-editor-style/style.css' )
		);
		$settings['assets']['styles'][] = 'my-theme-stylesheet';
		var_dump( $settings['assets']['styles'] );
		return $settings;
	}
);
