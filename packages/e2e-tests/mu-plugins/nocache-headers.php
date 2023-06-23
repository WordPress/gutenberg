<?php
/**
 * Plugin Name: Gutenberg Test Plugin, No-cache Headers
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-nocache-headers
 */

// Remove 'no-store' from the Cache-Control header set by WordPress when running
// E2E tests. This is a workaround for an issue where E2E tests time out waiting
// for 'networkidle'.
add_filter(
	'nocache_headers',
	static function( $headers ) {
		$cache_control_parts      = explode( ', ', $headers['Cache-Control'] );
		$cache_control_parts      = array_diff( $cache_control_parts, array( 'no-store' ) );
		$headers['Cache-Control'] = implode( ', ', $cache_control_parts );
		return $headers;
	}
);
