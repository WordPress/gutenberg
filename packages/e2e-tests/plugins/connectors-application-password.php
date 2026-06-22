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

const GUTENBERG_TEST_CONNECTOR_USERNAME_SETTING = 'connectors_content_source_test_remote_wordpress_username';
const GUTENBERG_TEST_CONNECTOR_APPLICATION_PASSWORD_SETTING = 'connectors_content_source_test_remote_wordpress_application_password';

add_action(
	'wp_connectors_init',
	static function ( WP_Connector_Registry $registry ) {
		$registry->register(
			'test-remote-wordpress',
			array(
				'name'           => 'Test Remote WordPress',
				'description'    => 'Connect to a remote WordPress site for E2E testing.',
				'type'           => 'content_source',
				'authentication' => array(
					'method'                            => 'application_password',
					'credentials_url'                   => 'https://example.com/wp-admin/profile.php',
					'username_setting_name'             => GUTENBERG_TEST_CONNECTOR_USERNAME_SETTING,
					'application_password_setting_name' => GUTENBERG_TEST_CONNECTOR_APPLICATION_PASSWORD_SETTING,
				),
			)
		);
	}
);

register_deactivation_hook(
	__FILE__,
	static function () {
		delete_option( GUTENBERG_TEST_CONNECTOR_USERNAME_SETTING );
		delete_option( GUTENBERG_TEST_CONNECTOR_APPLICATION_PASSWORD_SETTING );
	}
);
