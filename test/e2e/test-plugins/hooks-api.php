<?php
/**
 * Plugin Name: Gutenberg Test Hooks API
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-hooks-api
 */
wp_enqueue_script(
	'gutenberg-test-hooks-api',
	plugins_url( 'hooks-api/index.js', __FILE__ ),
	array(
		'wp-components',
		'wp-data',
		'wp-element',
		'wp-edit-post',
		'wp-i18n',
		'wp-plugins',
	),
	filemtime( plugin_dir_path( __FILE__ ) . 'hooks-api/index.js' ),
	true
);
