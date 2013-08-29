<?php
/**
 * Installs WordPress for the purpose of the unit-tests
 *
 * @todo Reuse the init/load code in init.php
 */
error_reporting( E_ALL & ~E_DEPRECATED & ~E_STRICT );

$config_file_path = $argv[1];
$multisite = ! empty( $argv[2] );

define( 'WP_INSTALLING', true );
require_once $config_file_path;
require_once dirname( __FILE__ ) . '/functions.php';

$_SERVER['SERVER_PROTOCOL'] = 'HTTP/1.1';
$_SERVER['HTTP_HOST'] = WP_TESTS_DOMAIN;
$PHP_SELF = $GLOBALS['PHP_SELF'] = $_SERVER['PHP_SELF'] = '/index.php';

require_once ABSPATH . '/wp-settings.php';

require_once ABSPATH . '/wp-admin/includes/upgrade.php';
require_once ABSPATH . '/wp-includes/wp-db.php';

define( 'WP_TESTS_VERSION_FILE', ABSPATH . '.wp-tests-version' );

$wpdb->suppress_errors();
$installed = $wpdb->get_var( "SELECT option_value FROM $wpdb->options WHERE option_name = 'siteurl'" );
$wpdb->suppress_errors( false );

$hash = get_option( 'db_version' ) . ' ' . (int) $multisite . ' ' . sha1_file( $config_file_path );

if ( $installed && file_exists( WP_TESTS_VERSION_FILE ) && file_get_contents( WP_TESTS_VERSION_FILE ) == $hash )
	return;

$wpdb->query( 'SET storage_engine = INNODB' );
$wpdb->select( DB_NAME, $wpdb->dbh );

echo "Installing..." . PHP_EOL;

foreach ( $wpdb->tables() as $table => $prefixed_table ) {
	$wpdb->query( "DROP TABLE IF EXISTS $prefixed_table" );
}

foreach ( $wpdb->tables( 'ms_global' ) as $table => $prefixed_table ) {
	$wpdb->query( "DROP TABLE IF EXISTS $prefixed_table" );

	// We need to create references to ms global tables.
	if ( $multisite )
		$wpdb->$table = $prefixed_table;
}

wp_install( WP_TESTS_TITLE, 'admin', WP_TESTS_EMAIL, true, null, 'password' );

if ( $multisite ) {
	echo "Installing network..." . PHP_EOL;

	define( 'WP_INSTALLING_NETWORK', true );

	$title = WP_TESTS_TITLE . ' Network';
	$subdomain_install = false;

	install_network();
	populate_network( 1, WP_TESTS_DOMAIN, WP_TESTS_EMAIL, $title, '/', $subdomain_install );
}

file_put_contents( WP_TESTS_VERSION_FILE, $hash );
