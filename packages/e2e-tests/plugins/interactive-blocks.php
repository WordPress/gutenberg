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
				'callback'            => static function ( $request ) {
					$identity = $request->get_param( 'identity' );
					$posts    = array(
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
						$html .= gutenberg_e2e_activity_feed_card( $post, $identity );
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
					$identity = $request->get_param( 'identity' );
					$title    = $request->get_param( 'title' ) ?? 'New post';
					return rest_ensure_response(
						gutenberg_e2e_activity_feed_card(
							array(
								'id'    => 900,
								'title' => $title,
								'text'  => 'just published',
							),
							$identity
						)
					);
				},
			)
		);

		/*
		 * A single NEW comment for the activity feed's per-card "Add
		 * comment" button: spliced INTO the card's comments container via
		 * `renderHTML( comments, html )` — a splice below a keyed item,
		 * which must not remount the card (see the key-preservation tests).
		 */
		register_rest_route(
			'test/activity-feed/v1',
			'/comment',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function ( $request ) {
					$identity = $request->get_param( 'identity' );
					$post_id  = (int) $request->get_param( 'postId' );
					// A fresh comment id unique per post.
					$comment_id = 9000 + $post_id;
					$key_attr   = static function ( $name ) use ( $identity ) {
						if ( 'id' === $identity ) {
							return 'id="' . esc_attr( $name ) . '"';
						}
						if ( 'none' === $identity ) {
							return '';
						}
						return 'data-wp-key="' . esc_attr( $name ) . '"';
					};
					return rest_ensure_response(
						sprintf(
							'<p %3$s data-testid="comment-%1$d">a fresh comment on post %2$d</p>',
							$comment_id,
							$post_id,
							$key_attr( 'comment-' . $comment_id ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						)
					);
				},
			)
		);
	}
);

/**
 * Renders a single activity-feed post card: an article with its own
 * context (id + likes), a comment list, an init hook, and a like button.
 * Shared by the `test/activity-feed` block's server markup and the REST
 * fragments it fetches, so spliced-in cards are identical to SSR'd ones.
 *
 * The `identity` mode decides how the card (and its comments) are named:
 * `data-wp-key` (the user key, `renderHTML`'s first fallback candidate),
 * `id` (its second fallback), or neither (`none` — synthetic keys at
 * splice time). The e2e journey runs all three modes.
 *
 * @param array  $post     The post: id, title, text, comments (id => text).
 * @param string $identity Identity mode: 'data-wp-key', 'id', or 'none'.
 * @return string The card HTML.
 */
function gutenberg_e2e_activity_feed_card( $post, $identity = 'data-wp-key' ) {
	if ( ! in_array( $identity, array( 'data-wp-key', 'id', 'none' ), true ) ) {
		$identity = 'data-wp-key';
	}
	$post_id  = (int) $post['id'];
	$title    = $post['title'] ?? 'Untitled';
	$text     = $post['text'] ?? '';
	$comments = $post['comments'] ?? array();

	// The key attribute for a named element: `data-wp-key` (user key),
	// `id` (`renderHTML`'s fallback), or nothing (synthetic at splice
	// time). Comments follow the card's mode so the markup stays coherent.
	$key_attr = static function ( $name ) use ( $identity ) {
		if ( 'id' === $identity ) {
			return 'id="' . esc_attr( $name ) . '"';
		}
		if ( 'none' === $identity ) {
			return '';
		}
		return 'data-wp-key="' . esc_attr( $name ) . '"';
	};

	$comments_html = '';
	foreach ( $comments as $comment_id => $comment_text ) {
		$comments_html .= sprintf(
			'<p %3$s data-testid="comment-%1$d">%2$s</p>',
			(int) $comment_id,
			esc_html( $comment_text ),
			$key_attr( 'comment-' . $comment_id )
		);
	}
	return sprintf(
		'<article %5$s data-testid="post-%1$d" data-wp-context=\'{ "id": %1$d, "likes": 0 }\'>' .
		'<h3>%2$s</h3>' .
		'<p data-testid="post-%1$d-text">%3$s</p>' .
		'<div data-testid="post-%1$d-comments">%4$s</div>' .
		'<button data-testid="post-%1$d-like" data-wp-on--click="actions.like" data-wp-text="context.likes">0</button>' .
		'<button data-testid="post-%1$d-comment" data-wp-on--click="actions.addComment" data-identity="' . esc_attr( $identity ) . '" data-fragment-url="' . esc_url( rest_url( 'test/activity-feed/v1/comment' ) ) . '">Add comment</button>' .
		'<span data-wp-init="callbacks.initPost"></span>' .
		'</article>',
		$post_id,
		esc_html( $title ),
		esc_html( $text ),
		$comments_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		$key_attr( 'post-' . $post_id )
	);
}
