<?php
/**
 * Plugin Name: Gutenberg Test Plugin, RTC WebSocket Provider
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-rtc-websocket-provider
 */

/**
 * Enqueues a test-only WebSocket sync provider for RTC e2e tests.
 */
function gutenberg_test_rtc_websocket_provider_enqueue() {
	$script_path = plugin_dir_path( __FILE__ ) . 'rtc-websocket-provider/build/index.js';
	$ws_url      = '';

	// The Playwright globalSetup writes the resolved WS URL here so the PHP
	// plugin can find it. wp-env does not forward host env vars into the
	// container, so getenv() alone would always miss any port override.
	$config_path = plugin_dir_path( __FILE__ ) . 'rtc-websocket-provider/build/runtime-config.json';
	if ( file_exists( $config_path ) ) {
		$config = json_decode( file_get_contents( $config_path ), true );
		if ( is_array( $config ) && ! empty( $config['url'] ) ) {
			$ws_url = $config['url'];
		}
	}

	if ( ! $ws_url ) {
		$ws_url = getenv( 'GUTENBERG_RTC_TEST_WS_URL' );
	}

	if ( ! $ws_url ) {
		$ws_port = getenv( 'GUTENBERG_RTC_TEST_WS_PORT' );
		if ( ! $ws_port ) {
			$ws_port = '18991';
		}
		$ws_url = 'ws://127.0.0.1:' . $ws_port;
	}

	wp_enqueue_script(
		'gutenberg-test-rtc-websocket-provider',
		plugins_url( 'rtc-websocket-provider/build/index.js', __FILE__ ),
		array( 'wp-hooks', 'wp-sync' ),
		filemtime( $script_path ),
		true
	);

	wp_add_inline_script(
		'gutenberg-test-rtc-websocket-provider',
		'window.gutenbergTestWebSocketSync = ' . wp_json_encode(
			array(
				'url' => $ws_url,
			)
		) . ';',
		'before'
	);
}

add_action( 'enqueue_block_editor_assets', 'gutenberg_test_rtc_websocket_provider_enqueue' );
