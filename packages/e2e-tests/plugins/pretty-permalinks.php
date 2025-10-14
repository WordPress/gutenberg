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
	// Flush rewrite rules with hard flush to create .htaccess
	global $wp_rewrite;
	$wp_rewrite->set_permalink_structure( '/%postname%/' );
	$wp_rewrite->flush_rules( true );
}
register_activation_hook( __FILE__, 'gutenberg_e2e_enable_pretty_permalinks' );

/**
 * Disable pretty permalinks (reset to default)
 */
function gutenberg_e2e_disable_pretty_permalinks() {
	// Flush rewrite rules with hard flush to update .htaccess
	global $wp_rewrite;
	$wp_rewrite->set_permalink_structure( '' );
	$wp_rewrite->flush_rules( true );
}
register_deactivation_hook( __FILE__, 'gutenberg_e2e_disable_pretty_permalinks' );
