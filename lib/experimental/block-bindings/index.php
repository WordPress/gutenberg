<?php
/**
 * Require the necessary files.
 *
 * @package gutenberg
 */

require_once __DIR__ . '/sources/index.php';
require_once __DIR__ . '/html-processing.php';

// Register the sources.
$gutenberg_experiments = get_option( 'gutenberg-experiments' );
if ( $gutenberg_experiments ) {
	if ( array_key_exists( 'gutenberg-pattern-partial-syncing', $gutenberg_experiments ) ) {
		require_once __DIR__ . '/sources/pattern.php';
	}
	if ( array_key_exists( 'gutenberg-block-bindings', $gutenberg_experiments ) ) {
		require_once __DIR__ . '/sources/post-meta.php';
	}
}
