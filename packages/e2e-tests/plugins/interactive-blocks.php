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
					// `?v=2` returns different markup to test re-fetching
					// with fresh server content.
					if ( isset( $_GET['v'] ) && '2' === $_GET['v'] ) {
						return rest_ensure_response(
							'<p data-testid="version">version 2</p>'
						);
					}
					return rest_ensure_response(
						'<button data-testid="counter" data-wp-on--click="actions.increment" data-wp-text="context.count">0</button>' .
						'<p data-testid="version">version 1</p>'
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
						'<button data-testid="add-item" data-wp-on--click="actions.addItem">Add item</button>' .
						'<ul data-testid="list">' .
						'<template data-wp-each="state.items">' .
						'<li data-testid="item" data-wp-text="context.item"></li>' .
						'</template>' .
						'</ul>'
					);
				},
			)
		);

		/*
		 * Fragments for testing `renderHTML()` position modes. Each one is a
		 * plain fragment reading the island's context, with a distinct
		 * testid, so the e2e can assert both the position and that the
		 * inserted content was hydrated.
		 */
		register_rest_route(
			'test/render-element/v1',
			'/fragment/before',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response(
						'<p data-testid="frag-before" data-wp-text="context.count">0</p>'
					);
				},
			)
		);

		register_rest_route(
			'test/render-element/v1',
			'/fragment/after',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response(
						'<p data-testid="frag-after" data-wp-text="context.count">0</p>'
					);
				},
			)
		);

		register_rest_route(
			'test/render-element/v1',
			'/fragment/outer',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response(
						'<p data-testid="frag-outer" data-wp-text="context.count">0</p>'
					);
				},
			)
		);

		/*
		 * A fragment that runs a `data-wp-watch` callback: it runs on
		 * insertion and re-runs whenever `state.items` changes, updating
		 * `state.watchText` which the fragment's `data-wp-text` displays.
		 */
		register_rest_route(
			'test/render-element/v1',
			'/fragment/watch',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response(
						'<button data-testid="watch-add" data-wp-on--click="actions.addItem">Add</button>' .
						'<p data-testid="watch" data-wp-watch="callbacks.updateWatch" data-wp-text="state.watchText">not watched</p>'
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
						'<p data-testid="lifecycle" data-wp-init="actions.initFragment" data-wp-text="state.lifecycle">not initialized</p>'
					);
				},
			)
		);

		/*
		 * A fragment carrying `data-wp-router-region`. Once inserted and
		 * rendered, it registers as a swappable router region, so navigating
		 * to a page with the same region ID replaces its content.
		 */
		register_rest_route(
			'test/render-element/v1',
			'/fragment/region',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response(
						'<div data-wp-interactive="test/render-element" data-wp-router-region="test/region">' .
						'<p data-testid="region-fragment">fragment content</p>' .
						'</div>'
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
