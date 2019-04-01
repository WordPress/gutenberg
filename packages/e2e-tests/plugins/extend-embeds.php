<?php
/**
 * Plugin Name: Gutenberg Test Extend Embeds
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-extend-embeds
 */

/**
 * A fake preview endpoint for use when testing embed extentions that
 * have a custom preview endpoint.
 */
function extend_embeds_preview() {
	return '<p>This is a preview from a custom endpoint.</p>';
}

/**
 * Initialise the custom preview API endpoint.
 */
function extend_embeds_rest_api_init() {
	register_rest_route(
		'extend-embeds/v1',
		'/preview/',
		array(
			'methods'  => 'GET',
			'callback' => 'extend_embeds_preview',
		)
	);
}

/**
 * Registers a custom script for the plugin.
 */
function extend_embeds_init() {
	wp_enqueue_script(
		'gutenberg-test-extend-embeds',
		plugins_url( 'extend-embeds/index.js', __FILE__ ),
		array(
			'wp-element',
			'wp-editor',
			'wp-i18n',
			'wp-block-library',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'extend-embeds/index.js' ),
		true
	);
	add_action( 'rest_api_init', 'extend_embeds_rest_api_init' );
}

add_action( 'init', 'extend_embeds_init' );
