<?php
/**
 * Activates the plugins in one plugin folder, like `wp plugin activate` in the
 * Docker runtime. The caller runs it once per folder, in config order, so the
 * plugins before it are active and loaded, and a dependency's hooks are in
 * place when the plugins that require it are activated.
 *
 * Usage: php activate.php <site folder> <plugin folder>
 */

$_SERVER['HTTP_HOST'] = 'localhost';
require $argv[1] . '/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';

foreach ( array_keys( get_plugins( '/' . $argv[2] ) ) as $file ) {
	$result = activate_plugin( $argv[2] . '/' . $file );
	if ( is_wp_error( $result ) ) {
		fwrite( STDERR, $argv[2] . '/' . $file . ': ' . $result->get_error_message() . "\n" );
		exit( 1 );
	}
}
