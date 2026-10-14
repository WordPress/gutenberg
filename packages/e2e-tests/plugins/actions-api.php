<?php
/**
 * Plugin Name: Gutenberg Test Actions API
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Extends the actions of Pages through the actions API, one self-contained
 * function per case. Every case registers its actions on
 * `wp_actions_api_init`, the action the registry fires the first time its
 * actions are read, after `init`.
 *
 * 1. `add_action_with_script_module`: an action
 *    (`gutenberg-test-actions-api/close-comments`) whose data is registered
 *    here and whose JavaScript parts come from
 *    `actions-api/close-comments.js`. The same module exports a complete
 *    `gutenberg-test-actions-api/archive` action no registration names: the
 *    module augments the actions it was registered with, so the entry is
 *    ignored and the action is not shown.
 *
 * @package gutenberg-test-actions-api
 */

/**
 * Case 1: an action (`gutenberg-test-actions-api/close-comments`) whose
 * eligibility and callback come from a script module. Two functions:
 *
 * - The module, on `init` like any plugin asset. It is registered, not
 *   enqueued: Gutenberg adds the modules of the registered actions to the
 *   import map of the editor pages.
 * - The action, on `wp_actions_api_init`. The action fires whenever the
 *   registry is first read, during REST requests too, so its callback
 *   registers the action and nothing else.
 */
function gutenberg_test_actions_api_register_close_comments_module() {
	wp_register_script_module(
		'gutenberg-test-actions-api/close-comments',
		plugins_url( 'actions-api/close-comments.js', __FILE__ ),
		array(),
		filemtime( __DIR__ . '/actions-api/close-comments.js' )
	);
}
add_action( 'init', 'gutenberg_test_actions_api_register_close_comments_module' );

function gutenberg_test_actions_api_add_action_with_script_module() {
	wp_register_actions(
		'gutenberg-test-actions-api',
		'postType',
		'page',
		array(
			array(
				'id'           => 'gutenberg-test-actions-api/close-comments',
				'label'        => 'Close comments',
				'supportsBulk' => true,
			),
		),
		'gutenberg-test-actions-api/close-comments'
	);
}
add_action( 'wp_actions_api_init', 'gutenberg_test_actions_api_add_action_with_script_module' );
