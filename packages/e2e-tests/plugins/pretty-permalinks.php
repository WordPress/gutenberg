<?php
/**
 * Plugin Name: Gutenberg Test Pretty Permalinks
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-pretty-permalinks
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enable pretty permalinks when plugin loads.
 * We use 'init' instead of activation hooks because activation hooks
 * don't fire reliably when activating via REST API (which e2e tests use).
 */
function gutenberg_e2e_setup_pretty_permalinks() {
	$current_structure = get_option( 'permalink_structure' );

	// Only set if not already set to avoid unnecessary writes
	if ( $current_structure !== '/%postname%/' ) {
		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		$wp_rewrite->flush_rules( true ); // Hard flush to create .htaccess
	}
}
add_action( 'init', 'gutenberg_e2e_setup_pretty_permalinks', 1 );

/**
 * Restore plain permalinks when plugin is deactivated.
 * Deactivation hooks do work via REST API.
 */
function gutenberg_e2e_restore_plain_permalinks() {
	global $wp_rewrite;
	$wp_rewrite->set_permalink_structure( '' );
	$wp_rewrite->flush_rules( true ); // Hard flush to update .htaccess
}
register_deactivation_hook( __FILE__, 'gutenberg_e2e_restore_plain_permalinks' );
