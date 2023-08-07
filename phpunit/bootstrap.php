<?php
/**
 * PHPUnit bootstrap file
 *
 * @package Gutenberg
 */

// Debug settings for parity with WordPress Core's PHPUnit tests.
if ( ! defined( 'WP_DEBUG' ) ) {
	define( 'WP_DEBUG', true );
}
if ( ! defined( 'LOCAL_WP_DEBUG_LOG' ) ) {
	define( 'LOCAL_WP_DEBUG_LOG', true );
}
if ( ! defined( 'LOCAL_WP_DEBUG_DISPLAY' ) ) {
	define( 'LOCAL_WP_DEBUG_DISPLAY', true );
}
if ( ! defined( 'LOCAL_SCRIPT_DEBUG' ) ) {
	define( 'LOCAL_SCRIPT_DEBUG', true );
}
if ( ! defined( 'LOCAL_WP_ENVIRONMENT_TYPE' ) ) {
	define( 'LOCAL_WP_ENVIRONMENT_TYPE', 'local' );
}

// Pretend that these are Core unit tests. This is needed so that
// wp_theme_has_theme_json() does not cache its return value between each test.
if ( ! defined( 'WP_RUN_CORE_TESTS' ) ) {
	define( 'WP_RUN_CORE_TESTS', true );
}

// Require composer dependencies.
require_once dirname( __DIR__ ) . '/vendor/autoload.php';

// If we're running in WP's build directory, ensure that WP knows that, too.
if ( 'build' === getenv( 'LOCAL_DIR' ) ) {
	define( 'WP_RUN_CORE_TESTS', true );
}

// Determine the tests directory (from a WP dev checkout).
// Try the WP_TESTS_DIR environment variable first.
$_tests_dir = getenv( 'WP_TESTS_DIR' );

// See if we're installed inside an existing WP dev instance.
if ( ! $_tests_dir ) {
	$_try_tests_dir = __DIR__ . '/../../../../../tests/phpunit';
	if ( file_exists( $_try_tests_dir . '/includes/functions.php' ) ) {
		$_tests_dir = $_try_tests_dir;
	}
}
// Fallback.
if ( ! $_tests_dir ) {
	$_tests_dir = '/tmp/wordpress-tests-lib';
}

// Give access to tests_add_filter() function.
require_once $_tests_dir . '/includes/functions.php';

// Do not try to load JavaScript files from an external URL - this takes a
// while.
define( 'GUTENBERG_LOAD_VENDOR_SCRIPTS', false );

/**
 * Manually load the plugin being tested.
 */
function _manually_load_plugin() {
	require dirname( __DIR__ ) . '/lib/load.php';
}
tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

/**
 * Adds a wp_die handler for use during tests.
 *
 * If bootstrap.php triggers wp_die, it will not cause the script to fail. This
 * means that tests will look like they passed even though they should have
 * failed. So we throw an exception if WordPress dies during test setup. This
 * way the failure is observable.
 *
 * @param string|WP_Error $message The error message.
 *
 * @throws Exception When a `wp_die()` occurs.
 */
function fail_if_died( $message ) {
	if ( is_wp_error( $message ) ) {
		$message = $message->get_error_message();
	}

	throw new Exception( 'WordPress died: ' . $message );
}
tests_add_filter( 'wp_die_handler', 'fail_if_died' );

$GLOBALS['wp_tests_options'] = array(
	'gutenberg-experiments' => array(
		'gutenberg-widget-experiments' => '1',
		'gutenberg-full-site-editing'  => 1,
	),
);

// Enable the widget block editor.
tests_add_filter( 'gutenberg_use_widgets_block_editor', '__return_true' );

/**
 * Register test block prior to theme.json generating metadata.
 *
 * This new block is used to test experimental selectors. It is registered
 * via `tests_add_filter()` here during bootstrapping so that it occurs prior
 * to theme.json generating block metadata. Once a core block, such as Image,
 * uses feature level selectors we could remove this in favour of testing via
 * the core block.
 */
function gutenberg_register_test_block_for_feature_selectors() {
	WP_Block_Type_Registry::get_instance()->register(
		'test/test',
		array(
			'api_version' => 3,
			'attributes'  => array(
				'textColor' => array(
					'type' => 'string',
				),
				'style'     => array(
					'type' => 'object',
				),
			),
			'supports'    => array(
				'__experimentalBorder'   => array(
					'radius'                 => true,
					'__experimentalSelector' => '.inner',
				),
				'color'                  => array(
					'text' => true,
				),
				'spacing'                => array(
					'padding'                => true,
					'__experimentalSelector' => '.inner',
				),
				'typography'             => array(
					'fontSize'               => true,
					'__experimentalSelector' => '.sub-heading',
				),
				'__experimentalSelector' => '.wp-block-test, .wp-block-test__wrapper',
			),
		)
	);

	WP_Block_Type_Registry::get_instance()->register(
		'my/block-with-selectors',
		array(
			'api_version' => 2,
			'attributes'  => array(
				'textColor' => array(
					'type' => 'string',
				),
				'style'     => array(
					'type' => 'object',
				),
			),
			'supports'    => array(
				'__experimentalBorder' => array(
					'radius' => true,
				),
				'color'                => array(
					'background' => true,
					'text'       => true,
				),
				'spacing'              => array(
					'padding' => true,
				),
				'typography'           => array(
					'fontSize' => true,
				),
			),
			'selectors'   => array(
				'root'       => '.custom-root-selector',
				'border'     => array(
					'root' => '.custom-root-selector img',
				),
				'color'      => array(
					'text' => '.custom-root-selector > figcaption',
				),
				'typography' => '.custom-root-selector > figcaption',
			),
		)
	);
}
tests_add_filter( 'init', 'gutenberg_register_test_block_for_feature_selectors' );

// Start up the WP testing environment.
require $_tests_dir . '/includes/bootstrap.php';

// Use existing behavior for wp_die during actual test execution.
remove_filter( 'wp_die_handler', 'fail_if_died' );
