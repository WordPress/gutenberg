<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Nonce
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-plugin-nonce
 */

/**
 * Returns the nonce life time.
 */
function gutenberg_test_plugin_nonce_life() {
	return 5;
}
add_filter( 'nonce_life', 'gutenberg_test_plugin_nonce_life' );
