<?php
/**
 * Installs WordPress for running the tests and loads WordPress and the test libraries
 */


$config_file_path = dirname( dirname( __FILE__ ) );
if ( ! file_exists( $config_file_path . '/wp-tests-config.php' ) ) {
	// Support the config file from the root of the develop repository.
	if ( basename( $config_file_path ) === 'phpunit' && basename( dirname( $config_file_path ) ) === 'tests' )
		$config_file_path = dirname( dirname( $config_file_path ) );
}
$config_file_path .= '/wp-tests-config.php';

/*
 * Globalize some WordPress variables, because PHPUnit loads this file inside a function
 * See: https://github.com/sebastianbergmann/phpunit/issues/325
 */
global $wpdb, $current_site, $current_blog, $wp_rewrite, $shortcode_tags, $wp, $phpmailer, $wp_theme_directories;

if ( !is_readable( $config_file_path ) ) {
	die( "ERROR: wp-tests-config.php is missing! Please use wp-tests-config-sample.php to create a config file.\n" );
}
require_once $config_file_path;
require_once dirname( __FILE__ ) . '/functions.php';

tests_reset__SERVER();

define( 'WP_TESTS_TABLE_PREFIX', $table_prefix );
define( 'DIR_TESTDATA', dirname( __FILE__ ) . '/../data' );

define( 'WP_LANG_DIR', DIR_TESTDATA . '/languages' );

if ( ! defined( 'WP_TESTS_FORCE_KNOWN_BUGS' ) )
	define( 'WP_TESTS_FORCE_KNOWN_BUGS', false );

// Cron tries to make an HTTP request to the blog, which always fails, because tests are run in CLI mode only
define( 'DISABLE_WP_CRON', true );

define( 'WP_MEMORY_LIMIT', -1 );
define( 'WP_MAX_MEMORY_LIMIT', -1 );

define( 'REST_TESTS_IMPOSSIBLY_HIGH_NUMBER', 99999999 );

$PHP_SELF = $GLOBALS['PHP_SELF'] = $_SERVER['PHP_SELF'] = '/index.php';

// Should we run in multisite mode?
$multisite = '1' == getenv( 'WP_MULTISITE' );
$multisite = $multisite || ( defined( 'WP_TESTS_MULTISITE') && WP_TESTS_MULTISITE );
$multisite = $multisite || ( defined( 'MULTISITE' ) && MULTISITE );

// Override the PHPMailer
require_once( dirname( __FILE__ ) . '/mock-mailer.php' );
$phpmailer = new MockPHPMailer();

if ( ! defined( 'WP_DEFAULT_THEME' ) ) {
	define( 'WP_DEFAULT_THEME', 'default' );
}
$wp_theme_directories = array( DIR_TESTDATA . '/themedir1' );

system( WP_PHP_BINARY . ' ' . escapeshellarg( dirname( __FILE__ ) . '/install.php' ) . ' ' . escapeshellarg( $config_file_path ) . ' ' . $multisite );

if ( $multisite ) {
	echo "Running as multisite..." . PHP_EOL;
	defined( 'MULTISITE' ) or define( 'MULTISITE', true );
	defined( 'SUBDOMAIN_INSTALL' ) or define( 'SUBDOMAIN_INSTALL', false );
	$GLOBALS['base'] = '/';
} else {
	echo "Running as single site... To run multisite, use -c tests/phpunit/multisite.xml" . PHP_EOL;
}
unset( $multisite );

$GLOBALS['_wp_die_disabled'] = false;
// Allow tests to override wp_die
tests_add_filter( 'wp_die_handler', '_wp_die_handler_filter' );

// Preset WordPress options defined in bootstrap file.
// Used to activate themes, plugins, as well as  other settings.
if(isset($GLOBALS['wp_tests_options'])) {
	function wp_tests_options( $value ) {
		$key = substr( current_filter(), strlen( 'pre_option_' ) );
		return $GLOBALS['wp_tests_options'][$key];
	}

	foreach ( array_keys( $GLOBALS['wp_tests_options'] ) as $key ) {
		tests_add_filter( 'pre_option_'.$key, 'wp_tests_options' );
	}
}

// Load WordPress
require_once ABSPATH . '/wp-settings.php';

// Delete any default posts & related data
_delete_all_posts();

require dirname( __FILE__ ) . '/testcase.php';
require dirname( __FILE__ ) . '/testcase-rest-api.php';
require dirname( __FILE__ ) . '/testcase-rest-controller.php';
require dirname( __FILE__ ) . '/testcase-rest-post-type-controller.php';
require dirname( __FILE__ ) . '/testcase-xmlrpc.php';
require dirname( __FILE__ ) . '/testcase-ajax.php';
require dirname( __FILE__ ) . '/testcase-canonical.php';
require dirname( __FILE__ ) . '/exceptions.php';
require dirname( __FILE__ ) . '/utils.php';
require dirname( __FILE__ ) . '/spy-rest-server.php';

/**
 * A child class of the PHP test runner.
 *
 * Used to access the protected longOptions property, to parse the arguments
 * passed to the script.
 *
 * If it is determined that phpunit was called with a --group that corresponds
 * to an @ticket annotation (such as `phpunit --group 12345` for bugs marked
 * as #WP12345), then it is assumed that known bugs should not be skipped.
 *
 * If WP_TESTS_FORCE_KNOWN_BUGS is already set in wp-tests-config.php, then
 * how you call phpunit has no effect.
 */
class WP_PHPUnit_Util_Getopt extends PHPUnit_Util_Getopt {
	protected $longOptions = array(
	  'exclude-group=',
	  'group=',
	);
	function __construct( $argv ) {
		array_shift( $argv );
		$options = array();
		while ( list( $i, $arg ) = each( $argv ) ) {
			try {
				if ( strlen( $arg ) > 1 && $arg[0] === '-' && $arg[1] === '-' ) {
					PHPUnit_Util_Getopt::parseLongOption( substr( $arg, 2 ), $this->longOptions, $options, $argv );
				}
			}
			catch ( PHPUnit_Framework_Exception $e ) {
				// Enforcing recognized arguments or correctly formed arguments is
				// not really the concern here.
				continue;
			}
		}

		$skipped_groups = array(
			'ajax' => true,
			'ms-files' => true,
			'external-http' => true,
		);

		foreach ( $options as $option ) {
			switch ( $option[0] ) {
				case '--exclude-group' :
					foreach ( $skipped_groups as $group_name => $skipped ) {
						$skipped_groups[ $group_name ] = false;
					}
					continue 2;
				case '--group' :
					$groups = explode( ',', $option[1] );
					foreach ( $groups as $group ) {
						if ( is_numeric( $group ) || preg_match( '/^(UT|Plugin)\d+$/', $group ) ) {
							WP_UnitTestCase::forceTicket( $group );
						}
					}

					foreach ( $skipped_groups as $group_name => $skipped ) {
						if ( in_array( $group_name, $groups ) ) {
							$skipped_groups[ $group_name ] = false;
						}
					}
					continue 2;
			}
		}

		$skipped_groups = array_filter( $skipped_groups );
		foreach ( $skipped_groups as $group_name => $skipped ) {
			echo sprintf( 'Not running %1$s tests. To execute these, use --group %1$s.', $group_name ) . PHP_EOL;
		}

		if ( ! isset( $skipped_groups['external-http'] ) ) {
			echo PHP_EOL;
			echo 'External HTTP skipped tests can be caused by timeouts.' . PHP_EOL;
			echo 'If this changeset includes changes to HTTP, make sure there are no timeouts.' . PHP_EOL;
			echo PHP_EOL;
		}
    }
}
new WP_PHPUnit_Util_Getopt( $_SERVER['argv'] );
