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
	function ( $settings ) {
		$settings['styles'][] = array(
			'css'            => 'p { border: 1px solid red }',
			'__unstableType' => 'plugin',
		);
		return $settings;
	}
);
