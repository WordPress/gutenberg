<?php
/**
 * Installs WordPress in the site folder if it isn't yet.
 *
 * Usage: php install.php <site folder> <title>
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
