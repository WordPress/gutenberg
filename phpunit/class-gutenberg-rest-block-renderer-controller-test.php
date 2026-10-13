<?php
/**
 * Tests for editor content in the existing block renderer REST endpoint.
 *
 * @package gutenberg
 */
class Tests_REST_Block_Renderer_Editor_Content extends WP_Test_REST_TestCase {
	const ROUTE         = '/wp/v2/block-renderer/core/table-of-contents';
	const MATCHED_ROUTE = '/wp/v2/block-renderer/(?P<name>[a-z0-9-]+/[a-z0-9-]+)';

	private $post_id;
	private $saved_content;

	public function set_up() {
		parent::set_up();
		$author_id           = self::factory()->user->create( array( 'role' => 'author' ) );
		$this->saved_content = '<!-- wp:table-of-contents /-->' . $this->heading( 'Saved heading' );
		$this->post_id       = self::factory()->post->create(
			array(
				'post_author'  => $author_id,
				'post_status'  => 'publish',
				'post_content' => $this->saved_content,
			)
		);
		wp_set_current_user( $author_id );
	}

	public function tear_down() {
		wp_set_current_user( 0 );
		wp_reset_postdata();
		parent::tear_down();
	}

	public function test_editor_content_overrides_saved_headings() {
		$response = $this->preview( $this->heading( 'Editor heading' ) );
		$this->assertSame( 200, $response->get_status() );
		$html = $response->get_data()['rendered'];
		$this->assertStringContainsString( 'Editor heading', $html );
		$this->assertStringNotContainsString( 'Saved heading', $html );
	}

	public function test_empty_editor_content_clears_saved_headings() {
		$response = $this->preview( '' );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( '', $response->get_data()['rendered'] );
	}

	public function test_editor_preview_does_not_change_saved_content_or_frontend_rendering() {
		$response = $this->preview( $this->heading( 'Editor heading' ) );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $this->saved_content, get_post( $this->post_id )->post_content );

		$this->go_to( get_permalink( $this->post_id ) );
		$html = apply_filters( 'the_content', get_post( $this->post_id )->post_content );
		$this->assertSame( 1, preg_match( '/<nav\b[^>]*>.*?<\/nav>/s', $html, $matches ) );
		$this->assertStringContainsString( 'Saved heading', $matches[0] );
		$this->assertStringNotContainsString( 'Editor heading', $html );

		// A subsequent request without editor content must use saved headings.
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_param( 'context', 'edit' );
		$request->set_param( 'post_id', $this->post_id );
		$rendered = rest_get_server()->dispatch( $request )->get_data()['rendered'];
		$this->assertStringContainsString( 'Saved heading', $rendered );
		$this->assertStringNotContainsString( 'Editor heading', $rendered );
	}

	/** @dataProvider users_without_edit_access */
	public function test_editor_content_does_not_bypass_post_permissions( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );
		$response = $this->preview( $this->heading( 'Editor heading' ) );
		$this->assertSame( $role ? 403 : 401, $response->get_status() );
		$this->assertSame( 'block_cannot_read', $response->get_data()['code'] );
	}

	public static function users_without_edit_access() {
		return array(
			'anonymous'    => array( null ),
			'subscriber'   => array( 'subscriber' ),
			'other author' => array( 'author' ),
		);
	}

	public function test_editor_preview_preserves_rendering_filters() {
		$seen = array();
		$pre  = static function ( $html, $block ) use ( &$seen ) {
			if ( 'core/table-of-contents' === $block['blockName'] ) {
				$seen[] = 'pre_render_block';
			}
			return $html;
		};
		$data = static function ( $block ) use ( &$seen ) {
			if ( 'core/table-of-contents' === $block['blockName'] ) {
				$seen[]                    = 'render_block_data';
				$block['attrs']['ordered'] = false;
			}
			return $block;
		};
		$context = function ( $context, $block ) use ( &$seen ) {
			if ( 'core/table-of-contents' === $block['blockName'] ) {
				$seen[]                 = 'render_block_context';
				$context['postContent'] = $this->heading( 'Filtered heading' );
			}
			return $context;
		};
		add_filter( 'pre_render_block', $pre, 10, 2 );
		add_filter( 'render_block_data', $data );
		add_filter( 'render_block_context', $context, 10, 2 );
		try {
			$response = $this->preview( $this->heading( 'Editor heading' ) );
			$this->assertSame( 200, $response->get_status() );
			$html = $response->get_data()['rendered'];
			$this->assertSame( array( 'pre_render_block', 'render_block_data', 'render_block_context' ), $seen );
			$this->assertStringContainsString( '<ul>', $html );
			$this->assertStringContainsString( 'Filtered heading', $html );
			$this->assertStringNotContainsString( 'Editor heading', $html );
		} finally {
			remove_filter( 'pre_render_block', $pre, 10 );
			remove_filter( 'render_block_data', $data, 10 );
			remove_filter( 'render_block_context', $context, 10 );
		}
	}

	public function test_editor_preview_can_be_short_circuited_by_a_rendering_filter() {
		$pre = static function ( $html, $block ) {
			return 'core/table-of-contents' === $block['blockName'] ? '<nav>Cached preview</nav>' : $html;
		};
		add_filter( 'pre_render_block', $pre, 10, 2 );
		try {
			$response = $this->preview( $this->heading( 'Editor heading' ) );
			$this->assertSame( '<nav>Cached preview</nav>', $response->get_data()['rendered'] );
		} finally {
			remove_filter( 'pre_render_block', $pre, 10 );
		}
	}

	public function test_compatibility_does_not_modify_the_registered_endpoint() {
		$before = rest_get_server()->get_routes()[ self::MATCHED_ROUTE ];
		$this->assertSame( 200, $this->preview( $this->heading( 'Editor heading' ) )->get_status() );
		$this->assertSame( $before, rest_get_server()->get_routes()[ self::MATCHED_ROUTE ] );
	}

	public function test_existing_dispatch_result_is_preserved() {
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_param( 'post_content', $this->heading( 'Editor heading' ) );
		$response = new WP_REST_Response( array( 'rendered' => 'Cached preview' ) );
		$this->assertSame(
			$response,
			gutenberg_rest_block_renderer_editor_content_compat( $response, $request, self::MATCHED_ROUTE, $this->legacy_handler() )
		);
	}

	public function test_other_routes_are_left_unchanged() {
		$request = new WP_REST_Request( 'POST', '/wp/v2/posts' );
		$request->set_param( 'post_content', $this->heading( 'Editor heading' ) );
		$this->assertNull( gutenberg_rest_block_renderer_editor_content_compat( null, $request, '/wp/v2/posts', array() ) );
	}

	public function test_editor_content_is_supplied_even_when_the_endpoint_declares_support() {
		$handler = $this->legacy_handler();

		$handler['args']['post_content'] = array( 'type' => 'string' );
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_param( 'post_content', $this->heading( 'Editor heading' ) );
		$handler['callback'] = static function () {
			return new WP_REST_Response( apply_filters( 'render_block_context', array(), array( 'blockName' => 'core/table-of-contents' ) ) );
		};
		$response = gutenberg_rest_block_renderer_editor_content_compat( null, $request, self::MATCHED_ROUTE, $handler );
		$this->assertSame( $this->heading( 'Editor heading' ), $response->get_data()['postContent'] );
	}

	/** @dataProvider rendering_outcomes */
	public function test_temporary_context_is_removed_after_rendering( $outcome ) {
		$handler = $this->legacy_handler();
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_param( 'name', 'error' === $outcome ? 'core/missing-preview-block' : 'core/table-of-contents' );
		$request->set_param( 'attributes', array() );
		$request->set_param( 'post_id', $this->post_id );
		$request->set_param( 'post_content', $this->heading( 'Editor heading' ) );

		$before = $GLOBALS['wp_filter']['render_block_context']->callbacks ?? array();
		$throw  = static function ( $html, $block ) {
			if ( 'core/table-of-contents' === $block['blockName'] ) {
				throw new RuntimeException( 'Rendering failed' );
			}
			return $html;
		};
		if ( 'exception' === $outcome ) {
			add_filter( 'pre_render_block', $throw, 10, 2 );
		}
		try {
			try {
				$response = gutenberg_rest_block_renderer_editor_content_compat( null, $request, self::MATCHED_ROUTE, $handler );
				if ( 'exception' === $outcome ) {
					$this->fail( 'The rendering exception should propagate.' );
				} elseif ( 'error' === $outcome ) {
					$this->assertWPError( $response );
					$this->assertSame( 'block_invalid', $response->get_error_code() );
				} else {
					$this->assertStringContainsString( 'Editor heading', $response->get_data()['rendered'] );
				}
			} catch ( RuntimeException $error ) {
				$this->assertSame( 'exception', $outcome );
				$this->assertSame( 'Rendering failed', $error->getMessage() );
			}
		} finally {
			remove_filter( 'pre_render_block', $throw, 10 );
		}
		$this->assertSame( $before, $GLOBALS['wp_filter']['render_block_context']->callbacks ?? array() );

		$html = apply_filters( 'the_content', $this->saved_content );
		$this->assertSame( 1, preg_match( '/<nav\b[^>]*>.*?<\/nav>/s', $html, $matches ) );
		$this->assertStringContainsString( 'Saved heading', $matches[0] );
		$this->assertStringNotContainsString( 'Editor heading', $matches[0] );
	}

	public static function rendering_outcomes() {
		return array(
			'success'   => array( 'success' ),
			'error'     => array( 'error' ),
			'exception' => array( 'exception' ),
		);
	}

	private function legacy_handler() {
		$handler = rest_get_server()->get_routes()[ self::MATCHED_ROUTE ][0];
		// Model an endpoint without a declared editor-content argument.
		unset( $handler['args']['post_content'] );
		return $handler;
	}

	private function preview( $content ) {
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'context'      => 'edit',
					'post_id'      => $this->post_id,
					'attributes'   => array( 'ordered' => true ),
					'post_content' => $content,
				)
			)
		);
		return rest_get_server()->dispatch( $request );
	}

	private function heading( $text ) {
		return '<!-- wp:heading --><h2 class="wp-block-heading" id="section">' . esc_html( $text ) . '</h2><!-- /wp:heading -->';
	}
}
