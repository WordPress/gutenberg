<?php
/**
 * Plugin Name: Gutenberg Test Connectors JS Extensibility
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Registers two custom-type connectors on the server:
 *
 * 1. test_custom_service — also registered client-side via a script module using
 *    the merging strategy (two registerConnector calls with the same slug: one
 *    providing the render function, the other metadata).
 * 2. test_server_only_service — server-only, with no client-side render function,
 *    so it should not display a card in the UI.
 *
 * @package gutenberg-test-connectors-js-extensibility
 */

// Register two custom-type connectors for E2E testing.
add_action(
	'wp_connectors_init',
	static function ( WP_Connector_Registry $registry ) {
		$registry->register(
			'test_custom_service',
			array(
				'name'           => 'Test Custom Service',
				'description'    => 'A custom service for E2E testing.',
				'type'           => 'custom_service',
				'authentication' => array(
					'method' => 'none',
				),
			)
		);

		$registry->register(
			'test_server_only_service',
			array(
				'name'           => 'Test Server Only Service',
				'description'    => 'A server-only service with no JS render.',
				'type'           => 'custom_service',
				'authentication' => array(
					'method' => 'none',
				),
			)
		);
	}
);

// Enqueue the script module on the connectors page.
add_action(
	'admin_enqueue_scripts',
	static function () {
		if ( ! isset( $_GET['page'] ) || 'options-connectors-wp-admin' !== $_GET['page'] ) {
			return;
		}

		wp_register_script_module(
			'gutenberg-test-connectors-js-extensibility',
			plugins_url( 'connectors-js-extensibility/index.mjs', __FILE__ ),
			array(
				array(
					'id'     => '@wordpress/connectors',
					'import' => 'static',
				),
			)
		);
		wp_enqueue_script_module( 'gutenberg-test-connectors-js-extensibility' );
	}
);
