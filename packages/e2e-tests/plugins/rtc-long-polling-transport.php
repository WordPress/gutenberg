<?php
/**
 * Plugin Name: Gutenberg Test Plugin, RTC Long Polling Transport
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-rtc-long-polling-transport
 */

/**
 * Selects the HTTP long-polling collaboration transport for RTC e2e tests.
 *
 * @return string Transport identifier.
 */
function gutenberg_test_rtc_long_polling_transport() {
	return 'http-long-polling';
}
add_filter( 'wp_collaboration_transport', 'gutenberg_test_rtc_long_polling_transport' );

/**
 * Shrinks the long-poll hold budget for e2e runs.
 *
 * The shared collaboration fixtures wait on several consecutive wp-sync
 * responses; with the default 20 s hold an idle session cannot produce them
 * within the fixture timeouts. A 4 s hold keeps the long-polling semantics
 * (held requests, abort-and-resend) while keeping the suite fast.
 *
 * @return int Maximum wait in milliseconds.
 */
function gutenberg_test_rtc_long_polling_max_wait() {
	return 4000;
}
add_filter( 'wp_sync_long_poll_max_wait_ms', 'gutenberg_test_rtc_long_polling_max_wait' );
