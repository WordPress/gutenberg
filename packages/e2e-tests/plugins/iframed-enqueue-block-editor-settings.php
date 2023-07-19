<?php
/**
 * Plugin Name: Gutenberg Test Iframed enqueue block editor settings
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-iframed-iframed-enqueue-block-editor-settings
 */

add_action(
	'block_editor_settings_all',
	function( $settings ) {
		$settings['styles'][] = array( 'css' => 'p { border: 1px solid red }' );
		return $settings;
	}
);

add_action(
	'init',
	function() {
		wp_enqueue_script(
			'iframed-enqueue-block-editor-settings-script',
			plugin_dir_url( __FILE__ ) . 'iframed-enqueue-block-editor-settings/editor.js',
			array(
				'wp-editor',
			),
			filemtime( plugin_dir_path( __FILE__ ) . 'iframed-enqueue-block-editor-settings/editor.js' )
		);
	}
);
