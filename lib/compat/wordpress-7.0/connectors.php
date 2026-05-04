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
	 *         @type string $slug The WordPress.org plugin slug.
	 *     }
	 * }
	 * @phpstan-return ?array{
	 *     name: non-empty-string,
	 *     description: non-empty-string,
	 *     logo_url?: non-empty-string,
	 *     type: non-empty-string,
	 *     authentication: array{
	 *         method: 'api_key'|'none',
	 *         credentials_url?: non-empty-string,
	 *         setting_name?: non-empty-string,
	 *         constant_name?: non-empty-string,
	 *         env_var_name?: non-empty-string
	 *     },
	 *     plugin?: array{
	 *         slug: non-empty-string
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
	 *             @type string $slug The WordPress.org plugin slug.
	 *         }
	 *     }
	 * }
	 * @phpstan-return array<string, array{
	 *     name: non-empty-string,
	 *     description: non-empty-string,
	 *     logo_url?: non-empty-string,
	 *     type: non-empty-string,
	 *     authentication: array{
	 *         method: 'api_key'|'none',
	 *         credentials_url?: non-empty-string,
	 *         setting_name?: non-empty-string,
	 *         constant_name?: non-empty-string,
	 *         env_var_name?: non-empty-string
	 *     },
	 *     plugin?: array{
	 *         slug: non-empty-string
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
	 * @return string|null The logo URL, or null if the path is empty or
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
			return plugins_url( substr( $path, strlen( $mu_plugin_dir ) ), WPMU_PLUGIN_DIR . '/.' );
		}

		$plugin_dir = wp_normalize_path( WP_PLUGIN_DIR );
		if ( str_starts_with( $path, $plugin_dir . '/' ) ) {
			return plugins_url( substr( $path, strlen( $plugin_dir ) ) );
		}

		_doing_it_wrong(
			__FUNCTION__,
			__( 'Provider logo path must be located within the plugins or must-use plugins directory.' ),
			'7.0.0'
		);

		return null;
	}
}
