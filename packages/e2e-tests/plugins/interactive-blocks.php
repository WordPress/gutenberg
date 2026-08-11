<?php
/**
 * Plugin Name: Gutenberg Test Interactive Blocks
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-interactive-blocks
 */

/**
 * Renders a single activity-feed post card: a keyed article with its own
 * context (id + likes), a comment list, an init hook, and a like button.
 * Shared by the `test/activity-feed` block's server markup and the REST
 * fragments it fetches, so spliced-in cards are identical to SSR'd ones.
 *
 * @param array $post The post: id, title, text, comments (id => text).
 * @return string The card HTML.
 */
function gutenberg_e2e_activity_feed_card( $post ) {
	$post_id   = (int) $post['id'];
	$title     = $post['title'] ?? 'Untitled';
	$text      = $post['text'] ?? '';
	$comments  = $post['comments'] ?? array();
	$comments_html = '';
	foreach ( $comments as $comment_id => $comment_text ) {
		$comments_html .= sprintf(
			'<p data-wp-key="comment-%1$d" data-testid="comment-%1$d">%2$s</p>',
			(int) $comment_id,
			esc_html( $comment_text )
		);
	}
	return sprintf(
		'<article data-wp-key="post-%1$d" data-testid="post-%1$d" data-wp-context=\'{ "id": %1$d, "likes": 0 }\'>' .
		'<h3>%2$s</h3>' .
		'<p data-testid="post-%1$d-text">%3$s</p>' .
		'<div data-testid="post-%1$d-comments">%4$s</div>' .
		'<button data-testid="post-%1$d-like" data-wp-on--click="actions.like" data-wp-text="context.likes">0</button>' .
		'<span data-wp-init="callbacks.initPost"></span>' .
		'</article>',
		$post_id,
		esc_html( $title ),
		esc_html( $text ),
		$comments_html // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	);
}

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
		 * `test/render-html` block to fetch and hydrate with
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
						'<div data-wp-interactive="test/render-html" data-wp-router-region="test/region">' .
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
		 * `renderHTML()`.
		 */
		register_rest_route(
			'test/render-html/v1',
			'/fragment/island',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response(
						'<div data-wp-interactive="test/render-html" data-wp-context=\'{ "count": 0 }\'>' .
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
						'<div data-wp-interactive="test/render-html/nested" data-testid="nested-island">' .
						'<span data-testid="nested-init" data-wp-init="callbacks.initOnce"></span>' .
						'<div data-testid="nested-container"></div>' .
						'<p data-testid="nested-count" data-wp-text="state.initCount">0</p>' .
						'</div>'
					);
				},
			)
		);

		/*
		 * A fragment of OLDER posts (ids 101+) for the activity feed's
		 * "Load more" button: appended via `renderHTML( feedList, html )`.
		 * Cards are identical to the SSR'd ones, so the appended posts are
		 * fully interactive (like buttons, init hooks).
		 */
		register_rest_route(
			'test/activity-feed/v1',
			'/feed',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					$posts = array(
						array(
							'id'       => 101,
							'title'    => 'Older post one',
							'text'     => 'from the archives',
							'comments' => array(
								111 => 'a classic comment',
							),
						),
						array(
							'id'    => 102,
							'title' => 'Older post two',
							'text'  => 'also from the archives',
						),
					);
					$html = '';
					foreach ( $posts as $post ) {
						$html .= gutenberg_e2e_activity_feed_card( $post );
					}
					return rest_ensure_response( $html );
				},
			)
		);

		/*
		 * A single NEW post card for the activity feed's composer: prepended
		 * via `renderHTML( feedList, html, { mode: 'prepend' } )`. The title
		 * is echoed from the `?title=` query param (the composer input).
		 */
		register_rest_route(
			'test/activity-feed/v1',
			'/post',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function ( $request ) {
					$title = $request->get_param( 'title' ) ?? 'New post';
					return rest_ensure_response(
						gutenberg_e2e_activity_feed_card(
							array(
								'id'    => 900,
								'title' => $title,
								'text'  => 'just published',
							)
						)
					);
				},
			)
		);
	}
);
