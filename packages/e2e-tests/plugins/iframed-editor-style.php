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

add_action(
	'block_editor_settings_all',
	function( $settings ) {
		$settings['styles'][] = array( 'css' => 'p { border: 1px solid red }' );
		return $settings;
	}
);
