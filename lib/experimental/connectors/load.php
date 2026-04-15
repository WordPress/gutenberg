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

	add_submenu_page(
		'options-general.php',
		__( 'Connectors', 'gutenberg' ),
		__( 'Connectors', 'gutenberg' ),
		'manage_options',
		'options-connectors-wp-admin',
		'gutenberg_options_connectors_wp_admin_render_page',
		1
	);
}

require __DIR__ . '/default-connectors.php';

/**
 * Preloads the REST API responses the Connectors UI fetches on mount.
 *
 * Without this, the page does a network round-trip for site settings,
 * plugin capability discovery, and each connector's plugin record after
 * the JS hydrates, which noticeably delays first paint.
 *
 * @access private
 *
 * @param string[] $preload_paths Paths already queued for preloading.
 * @return string[] Paths with the Connectors-specific requests appended.
 */
function _gutenberg_connectors_preload_paths( array $preload_paths ): array {
	// getEntityRecord( 'root', 'site' ) in stage.tsx / use-connector-plugin.ts.
	$preload_paths[] = '/wp/v2/settings';

	// canUser( 'create', { kind: 'root', name: 'plugin' } ) in stage.tsx.
	$preload_paths[] = array( '/wp/v2/plugins', 'OPTIONS' );

	// AiPluginCallout in routes/connectors-home/ai-plugin-callout.tsx queries this
	// hardcoded ID to check whether the WP AI plugin is installed/active.
	$preload_paths[] = '/wp/v2/plugins/ai/ai?context=edit';

	// getEntityRecord( 'root', 'plugin', <basename> ) per connector in use-connector-plugin.ts.
	if ( function_exists( 'wp_get_connectors' ) ) {
		foreach ( wp_get_connectors() as $connector_data ) {
			if ( empty( $connector_data['plugin']['file'] ) ) {
				continue;
			}
			// core-data's plugin entity uses the basename with `.php` stripped
			// as the record key (see routes/connectors-home/use-connector-plugin.ts).
			$basename        = preg_replace( '/\.php$/', '', plugin_basename( $connector_data['plugin']['file'] ) );
			$preload_paths[] = '/wp/v2/plugins/' . $basename . '?context=edit';
		}
	}

	return $preload_paths;
}
add_filter( 'options-connectors-wp-admin_preload_paths', '_gutenberg_connectors_preload_paths' );
