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

register_deactivation_hook(
	__FILE__,
	static function () {
		delete_option( 'gutenberg_test_cap_restriction' );
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
