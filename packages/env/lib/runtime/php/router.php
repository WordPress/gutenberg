<?php
/**
 * Router for PHP's built-in server: serves existing files as they are and
 * sends everything else to WordPress, like the rewrite rules in .htaccess.
 */

$root = $_SERVER['DOCUMENT_ROOT'];
$path = parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH );

if ( is_file( $root . $path ) ) {
	return false;
}

$index = rtrim( $path, '/' ) . '/index.php';
if ( ! is_file( $root . $index ) ) {
	$index = '/index.php';
}
$_SERVER['SCRIPT_NAME'] = $index;
require $root . $index;
