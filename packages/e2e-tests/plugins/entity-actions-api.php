<?php
/**
 * Plugin Name: Gutenberg Test Entity Actions API
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Extends the actions of Pages through the Entity actions API, one
 * self-contained function per case. Every server case registers its actions
 * on `wp_entity_actions_api_init`, the action the registry fires the first
 * time its actions are read, after `init`, once the core actions are
 * registered.
 *
 * 1. `add_action_with_script_module`: an action (`gutenberg-test-feature`)
 *    whose data is declared here and whose callback comes from
 *    `entity-actions-api/feature.js`. The same module exports a complete
 *    `gutenberg-test-unregistered` action no registration names: the module
 *    only completes the actions it was registered with, so the entry is
 *    ignored and the action is not registered.
 * 2. `remove_core_action`: a core action (`duplicate-post`), unregistered
 *    for pages only.
 *
 * @package gutenberg-test-entity-actions-api
 */

/**
 * Case 1: an action (`gutenberg-test-feature`) whose callback comes from a
 * script module. Two functions:
 *
 * - The module, on `init` like any plugin asset. It is registered, not
 *   enqueued: Gutenberg adds the modules of the registered actions to the
 *   import map of the editor pages.
 * - The action, on `wp_entity_actions_api_init`. The action fires whenever
 *   the registry is first read, during REST requests too, so its callback
 *   registers the action and nothing else.
 */
function gutenberg_test_entity_actions_api_register_feature_module() {
	wp_register_script_module(
		'gutenberg-test-entity-actions-api/feature',
		plugins_url( 'entity-actions-api/feature.js', __FILE__ ),
		array(),
		filemtime( __DIR__ . '/entity-actions-api/feature.js' )
	);
}
add_action( 'init', 'gutenberg_test_entity_actions_api_register_feature_module' );

function gutenberg_test_entity_actions_api_add_action_with_script_module() {
	wp_register_entity_actions(
		'gutenberg-test-entity-actions-api',
		'postType',
		'page',
		array(
			array(
				'id'           => 'gutenberg-test-feature',
				'label'        => 'Feature',
				'supportsBulk' => true,
			),
		),
		'gutenberg-test-entity-actions-api/feature'
	);
}
add_action( 'wp_entity_actions_api_init', 'gutenberg_test_entity_actions_api_add_action_with_script_module' );

/**
 * Case 2: a core action (`duplicate-post`), unregistered for pages. The default
 * priority runs after the core actions, registered at priority 0: there is
 * nothing to unregister before.
 */
function gutenberg_test_entity_actions_api_remove_core_action() {
	wp_unregister_entity_actions( 'postType', 'page', array( 'duplicate-post' ) );
}
add_action( 'wp_entity_actions_api_init', 'gutenberg_test_entity_actions_api_remove_core_action' );
