<?php
/**
 * Bootstraps the Connectors page in wp-admin.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', 'gutenberg_connectors_add_settings_menu_item' );

/**
 * Registers the Connectors menu item under Settings.
 */
function gutenberg_connectors_add_settings_menu_item() {
	add_submenu_page(
		'options-general.php',
		__( 'Connectors', 'gutenberg' ),
		__( 'Connectors', 'gutenberg' ),
		'manage_options',
		'connections-wp-admin',
		'gutenberg_connections_wp_admin_render_page',
		1
	);
}

/**
 * Registers the example connectors extension as a script module.
 */
function gutenberg_register_connectors_extension_module() {
	wp_register_script_module(
		'gutenberg/connectors-extension',
		gutenberg_url( 'lib/experimental/connectors/connectors-extension.js' ),
		array( '@wordpress/connectors' ),
		filemtime( __DIR__ . '/connectors-extension.js' )
	);
}
add_action( 'init', 'gutenberg_register_connectors_extension_module' );

/**
 * Enqueues the connectors extension on the Connectors page.
 *
 * @param string $hook_suffix The current admin page.
 */
function gutenberg_enqueue_connectors_extension( $hook_suffix ) {
	if ( 'settings_page_connections-wp-admin' !== $hook_suffix ) {
		return;
	}
	wp_enqueue_script_module( 'gutenberg/connectors-extension' );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_enqueue_connectors_extension' );

require __DIR__ . '/gemini-connector.php';
require __DIR__ . '/debug-test.php';