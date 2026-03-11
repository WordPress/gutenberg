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
	 * @return array|null The registered connector data, or null if not registered.
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
	 * @return array[] An array of registered connectors keyed by connector ID.
	 */
	function wp_get_connectors(): array {
		$registry = WP_Connector_Registry::get_instance();
		if ( null === $registry ) {
			return array();
		}

		return $registry->get_all_registered();
	}
}
