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
	}
);

register_deactivation_hook(
	__FILE__,
	static function () {
		delete_option( GUTENBERG_TEST_CONNECTOR_CREDENTIALS_SETTING );
	}
);
