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
 * E2E Test Pretty Permalinks Plugin
 */
class E2E_Pretty_Permalinks {

	/**
	 * Store the original permalink structure
	 */
	private $original_permalink_structure;

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'enable_pretty_permalinks' ) );
		register_activation_hook( __FILE__, array( $this, 'activate' ) );
		register_deactivation_hook( __FILE__, array( $this, 'deactivate' ) );
	}

	/**
	 * Plugin activation - store original permalink structure and enable pretty permalinks
	 */
	public function activate() {
		// Store the current permalink structure
		$this->original_permalink_structure = get_option( 'permalink_structure', '' );

		// Enable pretty permalinks
		update_option( 'permalink_structure', '/%postname%/' );

		// Flush rewrite rules
		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		$wp_rewrite->flush_rules();

		// Store the original structure for later restoration
		update_option( 'e2e_original_permalink_structure', $this->original_permalink_structure );
	}

	/**
	 * Plugin deactivation - restore original permalink structure
	 */
	public function deactivate() {
		// Get the original permalink structure
		$original_structure = get_option( 'e2e_original_permalink_structure', '' );

		// Restore the original permalink structure
		update_option( 'permalink_structure', $original_structure );

		// Flush rewrite rules
		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure( $original_structure );
		$wp_rewrite->flush_rules();

		// Clean up the stored original structure
		delete_option( 'e2e_original_permalink_structure' );
	}

	/**
	 * Ensure pretty permalinks are enabled (in case of any issues)
	 */
	public function enable_pretty_permalinks() {
		// Double-check that pretty permalinks are enabled
		$current_structure = get_option( 'permalink_structure', '' );
		if ( $current_structure !== '/%postname%/' ) {
			update_option( 'permalink_structure', '/%postname%/' );
			global $wp_rewrite;
			$wp_rewrite->set_permalink_structure( '/%postname%/' );
			$wp_rewrite->flush_rules();
		}
	}
}

// Initialize the plugin
new E2E_Pretty_Permalinks();
