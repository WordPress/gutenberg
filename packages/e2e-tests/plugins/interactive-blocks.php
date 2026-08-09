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
		 * `renderHTML()`.
		 *
		 * The base fragment is intentionally a PLAIN fragment — it has no
		 * `data-wp-interactive` and no `data-wp-context`. It is inserted into
		 * the block's existing island, so it must inherit the island's
		 * namespace and live context.
		 */
		register_rest_route(
			'test/render-html/v1',
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

		/*
		 * A fragment carrying `data-wp-router-region`. Once inserted and
		 * rendered, it registers as a swappable router region, so navigating
		 * to a page with the same region ID replaces its content. The empty
		 * `content` div is where a test inserts a separate
		 * `renderHTML`-rendered node (with a window listener) to verify that
		 * navigating away cleans up that node's listeners.
		 */
		register_rest_route(
			'test/render-html/v1',
			'/fragment/region',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response(
						'<div data-wp-interactive="test/render-element" data-wp-router-region="test/region">' .
						'<p data-testid="region-fragment">fragment content</p>' .
						'<div data-testid="region-content"></div>' .
						'</div>'
					);
				},
			)
		);

		/*
		 * A fragment with a `data-wp-on-window--resize` node, used to test
		 * that removing the node (e.g. via `renderHTML(..., { position:
		 * 'inner' })`) cleans up its window listener.
		 */
		register_rest_route(
			'test/render-html/v1',
			'/fragment/listener',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response(
						'<span data-testid="listener" data-wp-on-window--resize="actions.incResize"></span>' .
						'<p data-testid="version">version 1</p>'
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
			'test/render-html/v1',
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

		/*
		 * A fragment with MIXED element and text content, to test that
		 * `renderHTML()` preserves text nodes instead of dropping them.
		 */
		register_rest_route(
			'test/render-html/v1',
			'/fragment/mixed',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response(
						'<span data-testid="mixed-span">a</span> and text'
					);
				},
			)
		);

		/*
		 * A NESTED ISLAND fragment — a `data-wp-interactive` element inside
		 * the enclosing island. Used to test that splicing into a container
		 * inside a nested island (a) does NOT create a second tree for it
		 * (its `data-wp-init` must not re-run) and (b) resolves the nested
		 * namespace for the spliced content.
		 */
		register_rest_route(
			'test/render-html/v1',
			'/fragment/nested',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response(
						'<div data-wp-interactive="test/render-element/nested" data-testid="nested-island">' .
						'<span data-testid="nested-init" data-wp-init="callbacks.initOnce"></span>' .
						'<div data-testid="nested-container"></div>' .
						'<p data-testid="nested-count" data-wp-text="state.initCount">0</p>' .
						'</div>'
					);
				},
			)
		);
	}
);
