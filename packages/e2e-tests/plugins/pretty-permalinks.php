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
 * Enable pretty permalinks for E2E tests
 */
function gutenberg_e2e_enable_pretty_permalinks() {
	// Enable pretty permalinks
	update_option( 'permalink_structure', '/%postname%/' );

	// Flush rewrite rules
	global $wp_rewrite;
	$wp_rewrite->set_permalink_structure( '/%postname%/' );
	$wp_rewrite->flush_rules();
}
register_activation_hook( __FILE__, 'gutenberg_e2e_enable_pretty_permalinks' );

/**
 * Disable pretty permalinks (reset to default)
 */
function gutenberg_e2e_disable_pretty_permalinks() {
	// Disable pretty permalinks (set to default/empty)
	update_option( 'permalink_structure', '' );

	// Flush rewrite rules
	global $wp_rewrite;
	$wp_rewrite->set_permalink_structure( '' );
	$wp_rewrite->flush_rules();
}
register_deactivation_hook( __FILE__, 'gutenberg_e2e_disable_pretty_permalinks' );
