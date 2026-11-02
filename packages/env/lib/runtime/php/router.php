<?php
/**
 * Router for PHP's built-in server: serves existing files as they are and
 * sends everything else to WordPress, like the rewrite rules in .htaccess.
 */

$root = $_SERVER['DOCUMENT_ROOT'];
$url  = parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH );
$path = rawurldecode( $url );

// Never leave the site folder.
if ( preg_match( '#(^|[/\\\\])\.\.([/\\\\]|$)#', $path ) ) {
	http_response_code( 400 );
	exit;
}

if ( is_file( $root . $path ) ) {
	return false;
}

// Like Apache, add the slash to a folder, so relative links work.
if ( is_dir( $root . $path ) && '/' !== substr( $path, -1 ) ) {
	$query = isset( $_SERVER['QUERY_STRING'] ) && '' !== $_SERVER['QUERY_STRING'] ? '?' . $_SERVER['QUERY_STRING'] : '';
	header( 'Location: ' . $url . '/' . $query, true, 301 );
	exit;
}

$index = rtrim( $path, '/' ) . '/index.php';
if ( ! is_file( $root . $index ) ) {
	$index = '/index.php';
}
$_SERVER['SCRIPT_NAME'] = $index;
require $root . $index;
