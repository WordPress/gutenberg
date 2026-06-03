<?php
/**
 * Connectors API functions.
 *
 * @package gutenberg
 * @since 7.0.0
 */

if ( ! function_exists( 'wp_is_connector_registered' ) ) {
	/**
	 * Checks if a connector is registered.
	 *
	 * @since 7.0.0
	 *
	 * @see WP_Connector_Registry::is_registered()
	 *
	 * @param string $id The connector identifier.
	 * @return bool True if the connector is registered, false otherwise.
	 */
	function wp_is_connector_registered( string $id ): bool {
		$registry = WP_Connector_Registry::get_instance();
		if ( null === $registry ) {
			return false;
		}

		return $registry->is_registered( $id );
	}
}

if ( ! function_exists( 'wp_get_connector' ) ) {
	/**
	 * Retrieves a registered connector.
	 *
	 * @since 7.0.0
	 *
	 * @see WP_Connector_Registry::get_registered()
	 *
	 * @param string $id The connector identifier.
	 * @return array|null {
	 *     Connector data, or null if not registered.
	 *
	 *     @type string $name           The connector's display name.
	 *     @type string $description    The connector's description.
	 *     @type string $logo_url       Optional. URL to the connector's logo image.
	 *     @type string $type           The connector type, e.g. 'ai_provider' or 'spam_filtering'.
	 *     @type array  $authentication {
	 *         Authentication configuration. When method is 'api_key', includes
	 *         credentials_url, setting_name, and optionally constant_name and
	 *         env_var_name. When 'none', only method is present.
	 *
	 *         @type string $method          The authentication method: 'api_key' or 'none'.
	 *         @type string $credentials_url Optional. URL where users can obtain API credentials.
	 *         @type string $setting_name    Optional. The setting name for the API key.
	 *         @type string $constant_name   Optional. PHP constant name for the API key.
	 *         @type string $env_var_name    Optional. Environment variable name for the API key.
	 *     }
	 *     @type array  $plugin         {
	 *         Optional. Plugin data for install/activate UI.
	 *
	 *         @type string   $file      The plugin's main file path relative to the plugins
	 *                                   directory (e.g. 'my-plugin/my-plugin.php' or 'hello.php').
	 *         @type callable $is_active Callback to determine whether the plugin is active. Receives no arguments and must return bool.
	 *                                   Defaults to `__return_true`.
	 *     }
	 * }
	 * @phpstan-return ?array{
	 *     name: non-empty-string,
	 *     description: string,
	 *     logo_url?: non-empty-string,
	 *     type: non-empty-string,
	 *     authentication: array{
	 *         method: 'api_key'|'none',
	 *         credentials_url?: non-empty-string,
	 *         setting_name?: non-empty-string,
	 *         constant_name?: non-empty-string,
	 *         env_var_name?: non-empty-string
	 *     },
	 *     plugin: array{
	 *         file?: non-empty-string,
	 *         is_active: callable(): bool,
	 *     }
	 * }
	 */
	function wp_get_connector( string $id ): ?array {
		$registry = WP_Connector_Registry::get_instance();
		if ( null === $registry ) {
			return null;
		}

		return $registry->get_registered( $id );
	}
}

if ( ! function_exists( 'wp_get_connectors' ) ) {
	/**
	 * Retrieves all registered connectors.
	 *
	 * @since 7.0.0
	 *
	 * @see WP_Connector_Registry::get_all_registered()
	 *
	 * @return array {
	 *     Connector settings keyed by connector ID.
	 *
	 *     @type array ...$0 {
	 *         Data for a single connector.
	 *
	 *         @type string      $name           The connector's display name.
	 *         @type string      $description    The connector's description.
	 *         @type string      $logo_url       Optional. URL to the connector's logo image.
	 *         @type string      $type           The connector type, e.g. 'ai_provider' or 'spam_filtering'.
	 *         @type array       $authentication {
	 *             Authentication configuration. When method is 'api_key', includes
	 *             credentials_url, setting_name, and optionally constant_name and
	 *             env_var_name. When 'none', only method is present.
	 *
	 *             @type string $method          The authentication method: 'api_key' or 'none'.
	 *             @type string $credentials_url Optional. URL where users can obtain API credentials.
	 *             @type string $setting_name    Optional. The setting name for the API key.
	 *             @type string $constant_name   Optional. PHP constant name for the API key.
	 *             @type string $env_var_name    Optional. Environment variable name for the API key.
	 *         }
	 *         @type array       $plugin         {
	 *             Optional. Plugin data for install/activate UI.
	 *
	 *             @type string   $file      The plugin's main file path relative to the plugins
	 *                                       directory (e.g. 'my-plugin/my-plugin.php' or 'hello.php').
	 *             @type callable $is_active Callback to determine whether the plugin is active. Receives no arguments and must return bool.
	 *                                       Defaults to `__return_true`.
	 *         }
	 *     }
	 * }
	 * @phpstan-return array<string, array{
	 *     name: non-empty-string,
	 *     description: string,
	 *     logo_url?: non-empty-string,
	 *     type: non-empty-string,
	 *     authentication: array{
	 *         method: 'api_key'|'none',
	 *         credentials_url?: non-empty-string,
	 *         setting_name?: non-empty-string,
	 *         constant_name?: non-empty-string,
	 *         env_var_name?: non-empty-string
	 *     },
	 *     plugin: array{
	 *         file?: non-empty-string,
	 *         is_active: callable(): bool,
	 *     }
	 * }>
	 */
	function wp_get_connectors(): array {
		$registry = WP_Connector_Registry::get_instance();
		if ( null === $registry ) {
			return array();
		}

		return $registry->get_all_registered();
	}
}

if ( ! function_exists( '_wp_connectors_resolve_ai_provider_logo_url' ) ) {
	/**
	 * Resolves an AI provider logo file path to a URL.
	 *
	 * Converts an absolute file path within the plugins or must-use plugins
	 * directory to the corresponding URL.
	 *
	 * @access private
	 * @since 7.0.0
	 *
	 * @param string $path Absolute file path to the logo. Must be within
	 *                     WP_PLUGIN_DIR or WPMU_PLUGIN_DIR; triggers
	 *                     _doing_it_wrong() otherwise.
	 * @return non-empty-string|null The logo URL, or null if the path is empty or
	 *                     outside the supported directories.
	 */
	function _wp_connectors_resolve_ai_provider_logo_url( string $path ): ?string {
		if ( ! $path ) {
			return null;
		}

		$path = wp_normalize_path( $path );

		if ( ! file_exists( $path ) ) {
			return null;
		}

		$mu_plugin_dir = wp_normalize_path( WPMU_PLUGIN_DIR );
		if ( str_starts_with( $path, $mu_plugin_dir . '/' ) ) {
			$logo_url = plugins_url( substr( $path, strlen( $mu_plugin_dir ) ), WPMU_PLUGIN_DIR . '/.' );
			return $logo_url ? $logo_url : null;
		}

		$plugin_dir = wp_normalize_path( WP_PLUGIN_DIR );
		if ( str_starts_with( $path, $plugin_dir . '/' ) ) {
			$logo_url = plugins_url( substr( $path, strlen( $plugin_dir ) ) );
			return $logo_url ? $logo_url : null;
		}

		_doing_it_wrong(
			__FUNCTION__,
			__( 'Provider logo path must be located within the plugins or must-use plugins directory.' ),
			'7.0.0'
		);

		return null;
	}
}

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

	$data['filesystemCredentialsRequired'] = false === $stored;
	return $data;
}
add_filter( 'script_module_data_options-connectors-wp-admin', '_gutenberg_connectors_add_filesystem_data_to_script_module_data' );
