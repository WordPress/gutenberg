<?php
/**
 * PHPUnit bootstrap file
 *
 * @package Gutenberg
 */

// Determine the tests directory (from a WP dev checkout)
// Try the WP_TESTS_DIR environment variable first
$_tests_dir = getenv( 'WP_TESTS_DIR' );
// See if we're installed inside an existing WP dev instance
if ( ! $_tests_dir ) {
	$_try_tests_dir = __DIR__ . '/../../../../../tests/phpunit';
	if ( file_exists( $_tests_dir ) . '/includes/functions.php' ) {
		$_tests_dir = $_try_tests_dir;
	}
}
// Fallback
if ( ! $_tests_dir ) {
	$_tests_dir = '/tmp/wordpress-tests-lib';
}

// Give access to tests_add_filter() function.
require_once $_tests_dir . '/includes/functions.php';

/**
 * Manually load the plugin being tested.
 */
function _manually_load_plugin() {
	require dirname( dirname( __FILE__ ) ) . '/index.php';
}
tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

// Start up the WP testing environment.
require $_tests_dir . '/includes/bootstrap.php';
