<?php
/**
 * Tests for `content.blocks` in post REST API responses.
 *
 * @package gutenberg
 */

class Gutenberg_REST_Blocks_Test extends WP_Test_REST_TestCase {

	/**
	 * Post content with a nested block and whitespace between blocks.
	 *
	 * @var string
	 */
	const CONTENT = "<!-- wp:paragraph {\"align\":\"center\"} -->\n<p class=\"has-text-align-center\">Hello</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:group -->\n<div class=\"wp-block-group\"><!-- wp:paragraph -->\n<p>Inner</p>\n<!-- /wp:paragraph --></div>\n<!-- /wp:group -->";

	/**
	 * Keys of each block in `content.blocks`.
	 *
	 * @var string[]
	 */
	const BLOCK_KEYS = array( 'name', 'attributes', 'inner_blocks', 'inner_html', 'inner_content' );

	/**
	 * Query parameters that request `content.blocks`.
	 *
	 * @var array<string, string>
	 */
	const BLOCKS_PARAMS = array(
		'context' => 'edit',
		'_fields' => 'id,content.blocks',
	);

	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	protected static int $editor_id;

	/**
	 * Contributor user ID.
	 *
	 * @var int
	 */
	protected static int $contributor_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ): void {
		$editor_id            = $factory->user->create( array( 'role' => 'editor' ) );
		$contributor_id       = $factory->user->create( array( 'role' => 'contributor' ) );
		self::$editor_id      = is_int( $editor_id ) ? $editor_id : 0;
		self::$contributor_id = is_int( $contributor_id ) ? $contributor_id : 0;
	}

	public function set_up(): void {
		parent::set_up();

		// Rebuild the REST server so `rest_api_init` adds the filters again.
		$GLOBALS['wp_rest_server'] = null;
	}

	/**
	 * Creates a post with the test content.
	 *
	 * @param array<string, mixed> $args Extra post arguments.
	 * @return int Post ID.
	 */
	private function create_post( array $args = array() ): int {
		$post_id = self::factory()->post->create( array_merge( array( 'post_content' => self::CONTENT ), $args ) );
		$this->assertIsInt( $post_id );

		return $post_id;
	}

	/**
	 * Sends a GET request and returns the response data.
	 *
	 * @param string               $route  REST route.
	 * @param array<string, mixed> $params Query parameters.
	 * @return array<mixed> Response data.
	 */
	private function get( string $route, array $params ): array {
		$request = new WP_REST_Request( 'GET', $route );
		$request->set_query_params( $params );
		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );

		$data = rest_get_server()->response_to_data( $response, false );
		$this->assertIsArray( $data );

		return $data;
	}

	/**
	 * Requests a post and returns its `content` field.
	 *
	 * @param int                  $post_id Post ID.
	 * @param array<string, mixed> $params  Query parameters.
	 * @return array<mixed> The `content` field.
	 */
	private function get_content( int $post_id, array $params ): array {
		$data = $this->get( '/wp/v2/posts/' . $post_id, $params );
		$this->assertIsArray( $data['content'] );

		return $data['content'];
	}

	/**
	 * Requests a post as an editor and returns `content.blocks`.
	 *
	 * @param int $post_id Post ID.
	 * @return array<mixed> Block data.
	 */
	private function get_blocks( int $post_id ): array {
		wp_set_current_user( self::$editor_id );
		$content = $this->get_content( $post_id, self::BLOCKS_PARAMS );
		$this->assertArrayHasKey( 'blocks', $content );
		$this->assertIsArray( $content['blocks'] );

		return $content['blocks'];
	}

	public function test_blocks_are_added_to_content(): void {
		$blocks = $this->get_blocks( $this->create_post() );

		$this->assertCount( 2, $blocks, 'Whitespace between blocks should be dropped.' );
		$this->assertIsArray( $blocks[0] );
		$this->assertIsArray( $blocks[1] );
		$this->assertSame( self::BLOCK_KEYS, array_keys( $blocks[0] ) );
		$this->assertSame( 'core/paragraph', $blocks[0]['name'] );
		$this->assertEquals( (object) array( 'align' => 'center' ), $blocks[0]['attributes'] );
		$this->assertSame( 'core/group', $blocks[1]['name'] );

		$inner_blocks = $blocks[1]['inner_blocks'];
		$this->assertIsArray( $inner_blocks );
		$this->assertCount( 1, $inner_blocks );
		$this->assertIsArray( $inner_blocks[0] );
		$this->assertSame( self::BLOCK_KEYS, array_keys( $inner_blocks[0] ) );
		$this->assertSame( 'core/paragraph', $inner_blocks[0]['name'] );
	}

	public function test_empty_attributes_encode_as_object(): void {
		$json = wp_json_encode( $this->get_blocks( $this->create_post() ) );

		$this->assertIsString( $json );
		$this->assertStringContainsString( '"name":"core\/group","attributes":{}', $json );
	}

	public function test_password_protected_post_shows_blocks_to_editor(): void {
		$this->assertCount( 2, $this->get_blocks( $this->create_post( array( 'post_password' => 'secret' ) ) ) );
	}

	public function test_blocks_are_not_added_in_view_context(): void {
		$content = $this->get_content(
			$this->create_post(),
			array(
				'context' => 'view',
				'_fields' => 'content.blocks',
			)
		);

		$this->assertArrayNotHasKey( 'blocks', $content );
	}

	public function test_blocks_are_not_added_unless_requested(): void {
		wp_set_current_user( self::$editor_id );

		$this->assertArrayNotHasKey( 'blocks', $this->get_content( $this->create_post(), array( 'context' => 'edit' ) ) );
		$this->assertArrayNotHasKey(
			'blocks',
			$this->get_content(
				$this->create_post(),
				array(
					'context' => 'edit',
					'_fields' => 'content',
				)
			)
		);
	}

	public function test_collection_skips_posts_the_user_cannot_edit(): void {
		$own_post_id   = $this->create_post(
			array(
				'post_author' => self::$contributor_id,
				'post_status' => 'draft',
			)
		);
		$other_post_id = $this->create_post( array( 'post_author' => self::$editor_id ) );
		wp_set_current_user( self::$contributor_id );

		$items = $this->get( '/wp/v2/posts', array_merge( self::BLOCKS_PARAMS, array( 'status' => 'draft,publish' ) ) );

		$blocks_by_id = array();
		foreach ( $items as $item ) {
			$this->assertIsArray( $item );
			$this->assertIsInt( $item['id'] );
			$this->assertIsArray( $item['content'] );
			$blocks_by_id[ $item['id'] ] = $item['content']['blocks'] ?? null;
		}

		// Core may leave the post out of an edit context collection entirely.
		$this->assertNull( $blocks_by_id[ $other_post_id ] ?? null, 'Blocks should not be added for posts the user cannot edit.' );
		$this->assertArrayHasKey( $own_post_id, $blocks_by_id );
		$this->assertIsArray( $blocks_by_id[ $own_post_id ] );
	}

	public function test_schema_includes_blocks(): void {
		$data = rest_do_request( new WP_REST_Request( 'OPTIONS', '/wp/v2/pages' ) )->get_data();

		$this->assertIsArray( $data );
		$this->assertIsArray( $data['schema'] );
		$this->assertIsArray( $data['schema']['properties'] );
		$this->assertIsArray( $data['schema']['properties']['content'] );
		$this->assertIsArray( $data['schema']['properties']['content']['properties'] );
		$this->assertIsArray( $data['schema']['properties']['content']['properties']['blocks'] );
		$this->assertSame( array( 'edit' ), $data['schema']['properties']['content']['properties']['blocks']['context'] );
	}
}
