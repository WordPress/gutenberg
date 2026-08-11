<?php
/**
 * Plugin Name: Gutenberg Test Application Password Connector
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Registers an application password connector for E2E testing.
 *
 * @package gutenberg-test-connectors-application-password
 */

const GUTENBERG_TEST_CONNECTOR_CREDENTIALS_SETTING = 'connectors_content_source_test_remote_wordpress_credentials';
const GUTENBERG_TEST_CONNECTOR_ENV_VAR_NAME        = 'GUTENBERG_TEST_CONNECTOR_REMOTE_CREDENTIALS';

putenv( GUTENBERG_TEST_CONNECTOR_ENV_VAR_NAME . '=env-remote-user:abcd efgh ijkl mnop 1234' );

add_action(
	'wp_connectors_init',
	static function ( WP_Connector_Registry $registry ) {
		$registry->register(
			'test-remote-wordpress',
			array(
				'name'           => 'Test Remote WordPress',
				'description'    => 'Connect to example.com as a remote WordPress site.',
				'type'           => 'content_source',
				'authentication' => array(
					'method'          => 'application_password',
					'credentials_url' => 'https://example.com/wp-admin/profile.php',
					'setting_name'    => GUTENBERG_TEST_CONNECTOR_CREDENTIALS_SETTING,
				),
			)
		);

		$registry->register(
			'test-env-configured-wordpress',
			array(
				'name'           => 'Test Env Configured WordPress',
				'description'    => 'Connects using environment-variable credentials.',
				'type'           => 'content_source',
				'authentication' => array(
					'method'       => 'application_password',
					'env_var_name' => GUTENBERG_TEST_CONNECTOR_ENV_VAR_NAME,
				),
			)
		);
	}
);

add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			'gutenberg-test-connectors/v1',
			'/application-password',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => static function () {
					return array(
						'is_registered' => wp_is_connector_registered(
							'test-remote-wordpress'
						),
					);
				},
				'permission_callback' => static function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		// Exposes the raw stored credentials so tests can assert what was
		// persisted, bypassing the masking applied to /wp/v2/settings.
		register_rest_route(
			'gutenberg-test-connectors/v1',
			'/application-password-credentials',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => static function () {
					$credentials = get_option(
						GUTENBERG_TEST_CONNECTOR_CREDENTIALS_SETTING,
						array()
					);
					return array(
						'username' => is_array( $credentials ) && isset( $credentials['username'] ) ? $credentials['username'] : '',
						'password' => is_array( $credentials ) && isset( $credentials['password'] ) ? $credentials['password'] : '',
					);
				},
				'permission_callback' => static function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}
);

register_deactivation_hook(
	__FILE__,
	static function () {
		delete_option( GUTENBERG_TEST_CONNECTOR_CREDENTIALS_SETTING );
	}
);
