<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Plugins API
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-plugin-plugins-api
 */

/**
 * Registers custom scripts for the plugin.
 */
function enqueue_plugins_api_plugin_scripts() {
	wp_enqueue_script(
		'gutenberg-test-plugins-api-post-status-info',
		plugins_url( 'plugins-api/post-status-info.js', __FILE__ ),
		array(
			'wp-edit-post',
			'wp-element',
			'wp-i18n',
			'wp-plugins',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'plugins-api/post-status-info.js' ),
		true
	);

	wp_enqueue_script(
		'gutenberg-test-plugins-api-publish-pane;',
		plugins_url( 'plugins-api/publish-panel.js', __FILE__ ),
		array(
			'wp-edit-post',
			'wp-element',
			'wp-i18n',
			'wp-plugins',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'plugins-api/publish-panel.js' ),
		true
	);

	wp_enqueue_script(
		'gutenberg-test-plugins-api-sidebar',
		plugins_url( 'plugins-api/sidebar.js', __FILE__ ),
		array(
			'wp-components',
			'wp-compose',
			'wp-data',
			'wp-edit-post',
			'wp-editor',
			'wp-element',
			'wp-i18n',
			'wp-plugins',
			'wp-annotations',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'plugins-api/sidebar.js' ),
		true
	);

	wp_enqueue_script(
		'gutenberg-test-annotations-sidebar',
		plugins_url( 'plugins-api/annotations-sidebar.js', __FILE__ ),
		array(
			'wp-components',
			'wp-compose',
			'wp-data',
			'wp-edit-post',
			'wp-editor',
			'wp-element',
			'wp-i18n',
			'wp-plugins',
			'wp-annotations',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'plugins-api/annotations-sidebar.js' ),
		true
	);
}

add_action( 'init', 'enqueue_plugins_api_plugin_scripts' );
