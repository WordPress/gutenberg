<?php
/**
 * WP_REST_Blocks_Controller tests
 *
 * @package gutenberg
 */

/**
 * Tests for WP_REST_Blocks_Controller.
 */
class REST_Blocks_Controller_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * Our fake block's post ID.
	 *
	 * @var int
	 */
	protected static $post_id;

	/**
	 * Our fake user's ID.
	 *
	 * @var int
	 */
	protected static $user_id;

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$post_id = wp_insert_post(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_title'   => 'My cool block',
				'post_content' => '<!-- wp:core/paragraph --><p>Hello!</p><!-- /wp:core/paragraph -->',
			)
		);

		self::$user_id = $factory->user->create(
			array(
				'role' => 'editor',
			)
		);
	}

	/**
	 * Delete our fake data after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post_id );

		self::delete_user( self::$user_id );
	}

	/**
	 * Check that our routes get set up properly.
	 */
	public function test_register_routes() {
		$routes = $this->server->get_routes();

		$this->assertArrayHasKey( '/wp/v2/blocks', $routes );
		$this->assertCount( 2, $routes['/wp/v2/blocks'] );
		$this->assertArrayHasKey( '/wp/v2/blocks/(?P<id>[\d]+)', $routes );
		$this->assertCount( 3, $routes['/wp/v2/blocks/(?P<id>[\d]+)'] );
	}

	/**
	 * Check that we can GET a collection of blocks.
	 */
	public function test_get_items() {
		wp_set_current_user( self::$user_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/blocks' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals(
			array(
				array(
					'id'      => self::$post_id,
					'title'   => 'My cool block',
					'content' => '<!-- wp:core/paragraph --><p>Hello!</p><!-- /wp:core/paragraph -->',
				),
			), $response->get_data()
		);
	}

	/**
	 * Check that we can GET a single block.
	 */
	public function test_get_item() {
		wp_set_current_user( self::$user_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/blocks/' . self::$post_id );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals(
			array(
				'id'      => self::$post_id,
				'title'   => 'My cool block',
				'content' => '<!-- wp:core/paragraph --><p>Hello!</p><!-- /wp:core/paragraph -->',
			), $response->get_data()
		);
	}

	/**
	 * Check that we can POST to create a new block.
	 */
	public function test_create_item() {
		wp_set_current_user( self::$user_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/blocks/' . self::$post_id );
		$request->set_body_params(
			array(
				'title'   => 'New cool block',
				'content' => '<!-- wp:core/paragraph --><p>Wow!</p><!-- /wp:core/paragraph -->',
			)
		);

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals(
			array(
				'id'      => self::$post_id,
				'title'   => 'New cool block',
				'content' => '<!-- wp:core/paragraph --><p>Wow!</p><!-- /wp:core/paragraph -->',
			), $response->get_data()
		);
	}

	/**
	 * Check that we can PUT to update a block.
	 */
	public function test_update_item() {
		wp_set_current_user( self::$user_id );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/blocks/' . self::$post_id );
		$request->set_body_params(
			array(
				'title'   => 'Updated cool block',
				'content' => '<!-- wp:core/paragraph --><p>Nice!</p><!-- /wp:core/paragraph -->',
			)
		);

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals(
			array(
				'id'      => self::$post_id,
				'title'   => 'Updated cool block',
				'content' => '<!-- wp:core/paragraph --><p>Nice!</p><!-- /wp:core/paragraph -->',
			), $response->get_data()
		);
	}

	/**
	 * Check that we can DELETE a block.
	 */
	public function test_delete_item() {
		wp_set_current_user( self::$user_id );

		$request = new WP_REST_Request( 'DELETE', '/wp/v2/blocks/' . self::$post_id );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals(
			array(
				'deleted'  => true,
				'previous' => array(
					'id'      => self::$post_id,
					'title'   => 'My cool block',
					'content' => '<!-- wp:core/paragraph --><p>Hello!</p><!-- /wp:core/paragraph -->',
				),
			), $response->get_data()
		);
	}

	/**
	 * Check that we have defined a JSON schema.
	 */
	public function test_get_item_schema() {
		$request    = new WP_REST_Request( 'OPTIONS', '/wp/v2/blocks' );
		$response   = $this->server->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];

		$this->assertEquals( 3, count( $properties ) );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'title', $properties );
		$this->assertArrayHasKey( 'content', $properties );
	}

	public function test_context_param() {
		$this->markTestSkipped( 'Controller doesn\'t implement get_context_param().' );
	}
	public function test_prepare_item() {
		$this->markTestSkipped( 'Controller doesn\'t implement prepare_item().' );
	}
}
