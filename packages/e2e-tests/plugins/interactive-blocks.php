<?php
/**
 * Plugin Name: Gutenberg Test Interactive Blocks
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-interactive-blocks
 */

add_action(
	'init',
	function () {
		// Register all blocks found in the `interactive-blocks` folder.
		if ( file_exists( __DIR__ . '/interactive-blocks/' ) ) {
			$block_json_files = glob( __DIR__ . '/interactive-blocks/**/block.json' );

			// Auto register all blocks that were found.
			foreach ( $block_json_files as $block_json_file ) {
				register_block_type( $block_json_file );
			}
		}

		/*
		 * Disable the server directive processing during E2E testing. This is
		 * required to ensure that client hydration works even when the rendered
		 * HTML contains unbalanced tags and it couldn't be processed in the server.
		 */
		if (
			isset( $_GET['disable_server_directive_processing'] ) &&
			'true' === $_GET['disable_server_directive_processing']
		) {
			// Ensure the interactivity API is loaded.
			wp_interactivity();
			// But remove the server directive processing.
			add_filter( 'interactivity_process_directives', '__return_false' );
		}
	}
);

add_action(
	'rest_api_init',
	function () {
		/*
		 * REST routes that return server-rendered fragments for the
		 * `test/render-element` block to fetch and hydrate with
		 * `renderElement()`.
		 *
		 * The base fragment is intentionally a PLAIN fragment — it has no
		 * `data-wp-interactive` and no `data-wp-context`. It is inserted into
		 * the block's existing island, so it must inherit the island's
		 * namespace and live context.
		 */
		register_rest_route(
			'test/render-element/v1',
			'/fragment',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response(
						'<button data-testid="counter" data-wp-on--click="actions.increment" data-wp-text="context.count">0</button>'
					);
				},
			)
		);

		// A fragment that renders a list with `data-wp-each` (load-more pattern).
		register_rest_route(
			'test/render-element/v1',
			'/fragment/list',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response(
						'<ul data-testid="list">' .
						'<template data-wp-each="state.items">' .
						'<li data-testid="item" data-wp-text="context.item"></li>' .
						'</template>' .
						'</ul>'
					);
				},
			)
		);

		// A fragment that runs lifecycle directives (`data-wp-init`).
		register_rest_route(
			'test/render-element/v1',
			'/fragment/lifecycle',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response(
						'<p data-testid="lifecycle" data-wp-init="actions.initFragment">not initialized</p>'
					);
				},
			)
		);

		/*
		 * A SELF-CONTAINED island fragment — it carries its own
		 * `data-wp-interactive` and `data-wp-context`, so it does not depend
		 * on an enclosing island. This is the other supported shape for
		 * `renderElement()`.
		 */
		register_rest_route(
			'test/render-element/v1',
			'/fragment/island',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response(
						'<div data-wp-interactive="test/render-element" data-wp-context=\'{ "count": 0 }\'>' .
						'<button data-testid="island-counter" data-wp-on--click="actions.increment" data-wp-text="context.count">0</button>' .
						'</div>'
					);
				},
			)
		);
	}
);
