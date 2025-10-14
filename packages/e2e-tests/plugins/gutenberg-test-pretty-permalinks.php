<?php
/**
 * Plugin Name: Gutenberg Test Pretty Permalinks
 * Description: Simple plugin that enables pretty permalinks for E2E tests
 * Version: 1.0.0
 * Author: Gutenberg Team
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Plugin activation - enable pretty permalinks
 */
function gutenberg_test_pretty_permalinks_activate() {
	// Enable pretty permalinks
	update_option( 'permalink_structure', '/%postname%/' );

	// Flush rewrite rules
	global $wp_rewrite;
	$wp_rewrite->set_permalink_structure( '/%postname%/' );
	$wp_rewrite->flush_rules();
}
register_activation_hook( __FILE__, 'gutenberg_test_pretty_permalinks_activate' );

/**
 * Plugin deactivation - disable pretty permalinks
 */
function gutenberg_test_pretty_permalinks_deactivate() {
	// Disable pretty permalinks (set to default/empty)
	update_option( 'permalink_structure', '' );

	// Flush rewrite rules
	global $wp_rewrite;
	$wp_rewrite->set_permalink_structure( '' );
	$wp_rewrite->flush_rules();
}
register_deactivation_hook( __FILE__, 'gutenberg_test_pretty_permalinks_deactivate' );
