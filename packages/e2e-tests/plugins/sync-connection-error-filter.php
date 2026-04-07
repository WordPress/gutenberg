<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Sync Connection Error Filter
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-sync-connection-error-filter
 */

/**
 * Registers the editor.isSyncConnectionErrorHandled filter and custom modal.
 */
function enqueue_sync_connection_error_filter_scripts() {
	// Register the filter early on wp-hooks so it's available before the
	// editor modal renders. Plugins return true for error codes they handle.
	wp_add_inline_script(
		'wp-hooks',
		"wp.hooks.addFilter(
			'editor.isSyncConnectionErrorHandled',
			'gutenberg-test/custom-sync-error',
			function( isHandled, errorCode ) {
				if ( errorCode === 'connection-limit-exceeded' ) {
					return true;
				}
				return isHandled;
			}
		);"
	);

	// Enqueue the custom modal component that replaces the default UI
	// for connection-limit-exceeded errors.
	wp_enqueue_script(
		'gutenberg-test-sync-connection-error-filter',
		plugins_url( 'sync-connection-error-filter/index.js', __FILE__ ),
		array(
			'wp-components',
			'wp-data',
			'wp-element',
			'wp-i18n',
			'wp-plugins',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'sync-connection-error-filter/index.js' ),
		true
	);
}

add_action( 'enqueue_block_editor_assets', 'enqueue_sync_connection_error_filter_scripts' );
