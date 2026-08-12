<?php
/**
 * Plugin Name: Gutenberg Test Connectors Capability Restriction
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-connectors-capability-restriction
 */

add_action(
	'init',
	static function () {
		register_setting(
			'general',
			'gutenberg_test_cap_restriction',
			array(
				'type'         => 'string',
				'default'      => '',
				'show_in_rest' => true,
			)
		);
	}
);

register_activation_hook(
	__FILE__,
	static function () {
		delete_option( 'gutenberg_test_cap_restriction' );
	}
);

register_deactivation_hook(
	__FILE__,
	static function () {
		delete_option( 'gutenberg_test_cap_restriction' );
	}
);

add_action(
	'wp_connectors_init',
	static function ( WP_Connector_Registry $registry ) {
		$registry->register(
			'test_install_required_connector',
			array(
				'name'           => 'Test Install Required Connector',
				'description'    => 'A connector backed by a plugin that is not installed.',
				'type'           => 'ai_provider',
				'plugin'         => array(
					'file'      => 'gutenberg-test-connectors-never-installed/plugin.php',
					'is_active' => '__return_false',
				),
				'authentication' => array(
					'method'       => 'api_key',
					'setting_name' => 'gutenberg_test_install_required_connector_api_key',
				),
			)
		);

		$registry->register(
			'test_activate_required_connector',
			array(
				'name'           => 'Test Activate Required Connector',
				'description'    => 'A connector backed by an installed inactive plugin.',
				'type'           => 'ai_provider',
				'plugin'         => array(
					'file'      => 'hello/hello.php',
					'is_active' => '__return_false',
				),
				'authentication' => array(
					'method'       => 'api_key',
					'setting_name' => 'gutenberg_test_activate_required_connector_api_key',
				),
			)
		);
	}
);

add_filter(
	'map_meta_cap',
	static function ( $caps, $cap ) {
		$restriction = get_option( 'gutenberg_test_cap_restriction', '' );

		if ( empty( $restriction ) ) {
			return $caps;
		}

		$blocked_caps = array();

		switch ( $restriction ) {
			case 'no_install':
				$blocked_caps = array( 'install_plugins', 'upload_plugins' );
				break;
			case 'no_activate':
				$blocked_caps = array( 'activate_plugins' );
				break;
			case 'no_install_activate':
				$blocked_caps = array( 'install_plugins', 'upload_plugins', 'activate_plugins' );
				break;
			case 'disallow_file_mods':
				$blocked_caps = array( 'install_plugins', 'upload_plugins', 'delete_plugins', 'update_plugins' );
				break;
		}

		if ( in_array( $cap, $blocked_caps, true ) ) {
			return array( 'do_not_allow' );
		}

		return $caps;
	},
	10,
	2
);
