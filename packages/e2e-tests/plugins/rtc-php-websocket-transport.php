<?php
/**
 * Plugin Name: Gutenberg Test Plugin, RTC PHP WebSocket Transport
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-rtc-php-websocket-transport
 */

/**
 * Selects the PHP WebSocket collaboration transport for RTC e2e tests.
 *
 * @return string Transport identifier.
 */
function gutenberg_test_rtc_php_websocket_transport() {
	return 'php-websocket';
}
add_filter( 'wp_collaboration_transport', 'gutenberg_test_rtc_php_websocket_transport' );

/**
 * Points the browser at the WebSocket sync server published by the e2e
 * harness. The browser loads WordPress from localhost:8889 and the server
 * is published on localhost:18992; cookies are shared across ports on the
 * same host, so cookie auth works.
 *
 * @return string WebSocket URL.
 */
function gutenberg_test_rtc_php_websocket_url() {
	$url = getenv( 'GUTENBERG_RTC_PHP_WS_URL' );

	if ( ! $url ) {
		$url = 'ws://localhost:18992';
	}

	return $url;
}
add_filter( 'wp_sync_websocket_url', 'gutenberg_test_rtc_php_websocket_url' );
