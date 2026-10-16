<?php
/**
 * Connectors compatibility shims for WordPress 7.2.
 *
 * @package gutenberg
 */

/**
 * Registers the MCP Adapter connector when core does not register it.
 *
 * @param WP_Connector_Registry $registry Connector registry instance.
 */
function _gutenberg_register_mcp_adapter_connector( WP_Connector_Registry $registry ): void {
	if ( ! wp_supports_ai() || $registry->is_registered( 'mcp-adapter' ) ) {
		return;
	}

	$registry->register(
		'mcp-adapter',
		array(
			'name'           => __( 'WordPress MCP', 'gutenberg' ),
			'description'    => __( 'Connect AI agents and MCP clients to this site.', 'gutenberg' ),
			'type'           => 'mcp_server',
			'plugin'         => array(
				'file'      => 'mcp-adapter/mcp-adapter.php',
				'is_active' => static function () {
					return defined( 'WP_MCP_VERSION' );
				},
			),
			'authentication' => array(
				'method' => 'none',
			),
		)
	);
}
add_action( 'wp_connectors_init', '_gutenberg_register_mcp_adapter_connector' );

/**
 * Adds application password data for the current user to the Connectors page
 * when core does not provide it.
 *
 * @param array $data Existing script module data.
 * @return array Script module data with application password data added.
 */
function _gutenberg_add_connectors_application_passwords_data( array $data ): array {
	if ( isset( $data['applicationPasswords'] ) ) {
		return $data;
	}

	$user                         = wp_get_current_user();
	$data['applicationPasswords'] = array(
		'isSupported'        => wp_is_application_passwords_supported(),
		'isAvailable'        => wp_is_application_passwords_available(),
		'isAvailableForUser' => wp_is_application_passwords_available_for_user( $user ),
		'canCreate'          => current_user_can( 'create_app_password', $user->ID ),
		'username'           => $user->user_login,
		'profileUrl'         => admin_url( 'profile.php#application-passwords-section' ),
	);

	return $data;
}
add_filter( 'script_module_data_options-connectors-wp-admin', '_gutenberg_add_connectors_application_passwords_data', 20 );
