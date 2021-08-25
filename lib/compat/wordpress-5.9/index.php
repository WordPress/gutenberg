<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 *
 * @package gutenberg
 */

// Load the polyfills if we are on WP version lower than or equal to 5.9.
if ( version_compare( $GLOBALS['wp_version'], '5.9', '<' ) ) {
	require_once __DIR__ . '/widget-render-api-endpoint/index.php';
}
