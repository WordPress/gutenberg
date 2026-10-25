<?php
/**
 * Installs WordPress in the site folder if it isn't yet, and activates the
 * given plugins.
 *
 * Usage: php install.php <site folder> <title> [plugin folder ...]
 */

$_SERVER['HTTP_HOST'] = 'localhost';
define( 'WP_INSTALLING', true );
require $argv[1] . '/wp-load.php';
require ABSPATH . 'wp-admin/includes/upgrade.php';

if ( ! is_blog_installed() ) {
	wp_install( $argv[2], 'admin', 'wordpress@example.com', true, '', 'password' );
	// The same structure the Docker runtime sets.
	update_option( 'permalink_structure', '/%year%/%monthnum%/%day%/%postname%/' );
}

$folders = array_slice( $argv, 3 );
foreach ( array_keys( get_plugins() ) as $file ) {
	if ( in_array( dirname( $file ), $folders, true ) ) {
		$result = activate_plugin( $file );
		if ( is_wp_error( $result ) ) {
			fwrite( STDERR, $file . ': ' . $result->get_error_message() . "\n" );
			exit( 1 );
		}
	}
}
