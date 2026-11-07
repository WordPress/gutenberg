<?php
/**
 * Bootstraps the Connectors settings page in wp-admin.
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
	if ( ! function_exists( 'gutenberg_options_connectors_wp_admin_render_page' ) ) {
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
 * Preloads the REST API responses the Connectors UI fetches on mount.
 *
 * Without this, the page does a network round-trip for site settings,
 * plugin capability discovery, and each connector's plugin record after
 * the JS hydrates, which noticeably delays first paint.
 *
 * @access private
 *
 * @param array<string|string[]> $preload_paths Paths already queued for preloading.
 * @return array<string|string[]> Paths with the Connectors-specific requests appended.
 *
 * @phpstan-param array<non-falsy-string|array{ non-falsy-string, 'GET'|'OPTIONS' }> $preload_paths
 * @phpstan-return array<non-falsy-string|array{ non-falsy-string, 'GET'|'OPTIONS' }>
 */
function _gutenberg_connectors_preload_paths( array $preload_paths ): array {
	// getEntityRecord( 'root', 'site' ) in use-connector-plugin.ts / ai-plugin-callout.tsx.
	$preload_paths[] = '/wp/v2/settings';

	// canUser( 'create', { kind: 'root', name: 'plugin' } ) in stage.tsx.
	$preload_paths[] = array( '/wp/v2/plugins', 'OPTIONS' );

	// AiPluginCallout in routes/connectors-home/ai-plugin-callout.tsx queries this
	// hardcoded ID to check whether the WP AI plugin is installed/active.
	$preload_paths[] = '/wp/v2/plugins/ai/ai?context=edit';

	// getEntityRecord( 'root', 'plugin', <basename> ) per connector in use-connector-plugin.ts.
	foreach ( wp_get_connectors() as $connector_data ) {
		if ( empty( $connector_data['plugin']['file'] ) ) {
			continue;
		}
		// core-data's plugin entity uses the basename with `.php` stripped
		// as the record key (see routes/connectors-home/use-connector-plugin.ts).
		$basename        = preg_replace( '/\.php$/', '', plugin_basename( $connector_data['plugin']['file'] ) );
		$preload_paths[] = '/wp/v2/plugins/' . $basename . '?context=edit';
	}

	return $preload_paths;
}
add_filter( 'gutenberg_options_connectors_wp_admin_preload_paths', '_gutenberg_connectors_preload_paths' );
