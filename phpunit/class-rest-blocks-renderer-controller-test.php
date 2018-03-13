<?php
/**
 * WP_REST_Blocks_Renderer_Controller tests.
 *
 * @package gutenberg
 */

/**
 * Tests for WP_REST_Blocks_Renderer_Controller.
 */
class REST_Blocks_Renderer_Controller_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * Test block's name.
	 *
	 * @var string
	 */
	protected static $block_name = 'core/test-block';

	/**
	 * Test API user's ID.
	 *
	 * @var int
	 */
	protected static $user_id;

	/**
	 * Create test data before the tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {

		self::$user_id = $factory->user->create(
			array(
				'role' => 'editor',
			)
		);
	}

	/**
	 * Register test block.
	 */
	public function register_test_block() {
		register_block_type( self::$block_name, array(
			'attributes' => array(
				'foo' => array(
					'type' => 'string',
				),
			),
			'render_callback' => array( $this, 'render_test_block' ),
		) );
	}

	/**
	 * Test render callback.
	 *
	 * @param array $attributes Props.
	 * @return bool|string
	 */
	public function render_test_block( $attributes ) {
		if ( isset( $attributes['foo'] ) ) {
			return 'Expected test result';
		} else {
			return false;
		}
	}

	/**
	 * Delete test data after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$user_id );
	}

	/**
	 * Check that the route was registered properly.
	 */
	public function test_register_routes() {
		$routes = $this->server->get_routes();

		$this->assertArrayHasKey( '/gutenberg/v1/blocks-renderer/(?P<name>[\w-]+\/[\w-]+)', $routes );
	}

	/**
	 * Test getting item without permissions.
	 */
	public function test_get_item_output_without_permissions() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/gutenberg/v1/blocks-renderer/' . self::$block_name );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'gutenberg_block_cannot_read', $response, rest_authorization_required_code() );
	}

	/**
	 * Test getting item with invalid block name.
	 */
	public function test_get_item_output_invalid_block_name() {
		wp_set_current_user( self::$user_id );
		$request  = new WP_REST_Request( 'GET', '/gutenberg/v1/blocks-renderer/core/123' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_block_invalid_name', $response, 404 );
	}

	/**
	 * Check getting the correct block output.
	 * Test get_item_output().
	 *
	 * @covers test_get_item().
	 */
	public function test_get_item_output() {
		$this->register_test_block();
		wp_set_current_user( self::$user_id );

		$request = new WP_REST_Request( 'GET', '/gutenberg/v1/blocks-renderer/' . self::$block_name );
		$request->set_param( 'foo', 'bar' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( 'Expected test result', $data['output'] );

	}

	/**
	 * NA.
	 */
	public function test_update_item() {
		$this->markTestSkipped();
	}

	/**
	 * NA.
	 */
	public function test_create_item() {
		$this->markTestSkipped();
	}

	/**
	 * NA.
	 */
	public function test_delete_item() {
		$this->markTestSkipped();
	}

	/**
	 * NA.
	 */
	public function test_get_item() {
		$this->markTestSkipped();
	}

	/**
	 * NA.
	 */
	public function test_get_items() {
		$this->markTestSkipped();
	}

	/**
	 * NA.
	 */
	public function test_get_item_schema() {
		$this->markTestSkipped();
	}

	/**
	 * NA.
	 */
	public function test_context_param() {
		$this->markTestSkipped();
	}

	/**
	 * NA.
	 */
	public function test_prepare_item() {
		$this->markTestSkipped();
	}
}
