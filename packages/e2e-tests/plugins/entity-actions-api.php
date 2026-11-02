<?php
/**
 * Plugin Name: Gutenberg Test Entity Actions API
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Extends the actions of Pages through the entity actions API, one self-contained
 * function per case. Every case registers its actions on
 * `wp_entity_actions_api_init`, the action the registry fires the first time its
 * actions are read, after `init`, once the core actions are registered.
 *
 * 1. `add_action_with_script_module`: an action
 *    (`gutenberg-test-entity-actions-api/close-comments`) whose data is registered
 *    here and whose JavaScript parts come from
 *    `entity-actions-api/close-comments.js`. The same module exports a complete
 *    `gutenberg-test-entity-actions-api/archive` action no registration names: the
 *    module augments the actions it was registered with, so the entry is
 *    ignored and the action is not shown.
 * 2. `replace_action`: a substitute for a core action (`move-to-trash`),
 *    unregistered and registered again with a new label, merged into the core
 *    definition, and with the script module of the core action, which keeps
 *    its JavaScript parts.
 * 3. `remove_action`: the removal of a core action (`duplicate-post`).
 *
 * @package gutenberg-test-entity-actions-api
 */

/**
 * Case 1: an action (`gutenberg-test-entity-actions-api/close-comments`) whose
 * eligibility and callback come from a script module. Two functions:
 *
 * - The module, on `init` like any plugin asset. It is registered, not
 *   enqueued: Gutenberg adds the modules of the registered actions to the
 *   import map of the editor pages.
 * - The action, on `wp_entity_actions_api_init`. The action fires whenever the
 *   registry is first read, during REST requests too, so its callback
 *   registers the action and nothing else.
 */
function gutenberg_test_entity_actions_api_register_close_comments_module() {
	wp_register_script_module(
		'gutenberg-test-entity-actions-api/close-comments',
		plugins_url( 'entity-actions-api/close-comments.js', __FILE__ ),
		array(),
		filemtime( __DIR__ . '/entity-actions-api/close-comments.js' )
	);
}
add_action( 'init', 'gutenberg_test_entity_actions_api_register_close_comments_module' );

function gutenberg_test_entity_actions_api_add_action_with_script_module() {
	wp_register_entity_actions(
		'gutenberg-test-entity-actions-api',
		'postType',
		'page',
		array(
			array(
				'id'           => 'gutenberg-test-entity-actions-api/close-comments',
				'label'        => 'Close comments',
				'supportsBulk' => true,
			),
		),
		'gutenberg-test-entity-actions-api/close-comments'
	);
}
add_action( 'wp_entity_actions_api_init', 'gutenberg_test_entity_actions_api_add_action_with_script_module' );

/**
 * Case 2: a substitute for a core action (`move-to-trash`). Unregistering
 * drops its definition and detaches its script module, so the registration
 * that follows is the whole action: the core definition it returns, with a new
 * label, and not primary, so it moves from the row to the actions menu.
 * Registered with the script module of the core action, it keeps its
 * eligibility and its confirmation modal. It is only registered again when it
 * was registered, as WordPress registers some actions only for the users who
 * can perform them. The default priority runs after the core actions: there is
 * nothing to unregister before.
 */
function gutenberg_test_entity_actions_api_replace_action() {
	$removed = wp_unregister_entity_actions( 'postType', 'page', array( 'move-to-trash' ) );
	if ( ! $removed ) {
		return;
	}
	wp_register_entity_actions(
		'gutenberg-test-entity-actions-api',
		'postType',
		'page',
		array(
			array_merge(
				$removed[0],
				array(
					'label'     => 'Move to bin',
					'isPrimary' => false,
				)
			),
		),
		'@wordpress/core-actions/post_type_supports'
	);
}
add_action( 'wp_entity_actions_api_init', 'gutenberg_test_entity_actions_api_replace_action' );

/**
 * Case 3: the removal of a core action (`duplicate-post`).
 */
function gutenberg_test_entity_actions_api_remove_action() {
	wp_unregister_entity_actions( 'postType', 'page', array( 'duplicate-post' ) );
}
add_action( 'wp_entity_actions_api_init', 'gutenberg_test_entity_actions_api_remove_action' );
