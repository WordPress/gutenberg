<?php
/**
 * Plugin Name: Gutenberg Test Connectors JS Extensibility
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Registers a custom-type connector on the server and enqueues a script module
 * that registers it client-side using the merging strategy (two registerConnector
 * calls with the same slug: one providing the render function, the other metadata).
 *
 * @package gutenberg-test-connectors-js-extensibility
 */

// Register a non Ai provider connector which does not have UI component wired.
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
