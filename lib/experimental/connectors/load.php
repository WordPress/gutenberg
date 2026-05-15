<?php
/**
 * Bootstraps the Connectors page in wp-admin.
 *
 * @package gutenberg
 */

// Priority 11 to run after Core's menu.php sets up the connectors menu.
add_action( 'admin_menu', '_gutenberg_connectors_add_settings_menu_item', 11 );

/**
 * Registers the Connectors menu item under Settings.
 * Removes Core's connectors menu item first to prevent duplication.
 *
 * @access private
 */
function _gutenberg_connectors_add_settings_menu_item(): void {
	if ( ! class_exists( '\WordPress\AiClient\AiClient' ) || ! function_exists( 'gutenberg_options_connectors_wp_admin_render_page' ) ) {
		return;
	}

	// Remove Core's connectors menu item if it exists.
	remove_submenu_page( 'options-general.php', 'connectors-wp-admin' );
	remove_submenu_page( 'options-general.php', 'options-connectors.php' );

	$hook_suffix = add_submenu_page(
		'options-general.php',
		__( 'Connectors', 'gutenberg' ),
		__( 'Connectors', 'gutenberg' ),
		'manage_options',
		'options-connectors-wp-admin',
		'gutenberg_options_connectors_wp_admin_render_page',
		1
	);

	if ( $hook_suffix ) {
		add_action( "load-{$hook_suffix}", '_gutenberg_connectors_load_screen' );
	}
}

/**
 * Sets up the Connectors screen for plugin installation via the standard
 * `wp.updates` AJAX flow.
 *
 * Plugin installation from the Connectors screen goes through the REST
 * `/wp/v2/plugins` endpoint, which fails outright when the filesystem method
 * is not `direct` and credentials have not yet been stored. Enqueuing the
 * `updates` script and printing the standard "Connection Information" modal
 * mirrors what Plugins > Add Plugin already provides, so the React layer
 * can fall back to `wp.updates.installPlugin()` for the credentials flow.
 *
 * @access private
 */
function _gutenberg_connectors_load_screen(): void {
	wp_enqueue_script( 'updates' );
	add_action( 'admin_footer', '_gutenberg_connectors_print_filesystem_credentials_modal' );
}

/**
 * Prints the filesystem credentials modal on the Connectors screen.
 *
 * @access private
 */
function _gutenberg_connectors_print_filesystem_credentials_modal(): void {
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/template.php';

	wp_print_request_filesystem_credentials_modal();
	wp_print_admin_notice_templates();
}

/**
 * Exposes whether the current request can install plugins directly to the
 * Connectors script module.
 *
 * When the filesystem method is anything other than `direct` and stored
 * credentials are not yet available, the REST plugin endpoint will reject
 * an install attempt up front. Surfacing this state to the client lets the
 * React layer pre-emptively route through `wp.updates.installPlugin()`,
 * which displays the standard filesystem credentials modal.
 *
 * @access private
 *
 * @param array<string, mixed> $data Existing script module data.
 * @return array<string, mixed> Script module data with the filesystem flag added.
 */
function _gutenberg_connectors_add_filesystem_data_to_script_module_data( array $data ): array {
	require_once ABSPATH . 'wp-admin/includes/file.php';

	$method = get_filesystem_method();
	if ( 'direct' === $method ) {
		$data['filesystemCredentialsRequired'] = false;
		return $data;
	}

	ob_start();
	$stored = request_filesystem_credentials( self_admin_url() );
	ob_end_clean();

	$data['filesystemCredentialsRequired'] = empty( $stored );
	return $data;
}
add_filter( 'script_module_data_options-connectors-wp-admin', '_gutenberg_connectors_add_filesystem_data_to_script_module_data' );

require __DIR__ . '/default-connectors.php';
