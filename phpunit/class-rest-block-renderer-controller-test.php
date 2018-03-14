<?php
/**
 * WP_REST_Block_Renderer_Controller tests.
 *
 * @package gutenberg
 */

/**
 * Tests for WP_REST_Block_Renderer_Controller.
 *
 * @covers WP_REST_Block_Renderer_Controller
 */
class REST_Block_Renderer_Controller_Test extends WP_Test_REST_Controller_Testcase {

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
	 * Delete test data after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$user_id );
	}

	/**
	 * Set up.
	 *
	 * @see gutenberg_register_rest_routes()
	 */
	public function setUp() {
		$this->register_test_block();
		parent::setUp();
	}

	/**
	 * Tear down.
	 */
	public function tearDown() {
		WP_Block_Type_Registry::get_instance()->unregister( self::$block_name );
		parent::tearDown();
	}

	/**
	 * Register test block.
	 */
	public function register_test_block() {
		register_block_type( self::$block_name, array(
			'attributes'      => array(
				'some_string' => array(
					'type'    => 'string',
					'default' => 'some_default',
				),
				'some_int'    => array(
					'type' => 'integer',
				),
				'some_array'  => array(
					'type'  => 'array',
					'items' => array(
						'type' => 'integer',
					),
				),
			),
			'render_callback' => array( $this, 'render_test_block' ),
		) );
	}

	/**
	 * Test render callback.
	 *
	 * @param array $attributes Props.
	 * @return string Rendered attributes, which is here just JSON.
	 */
	public function render_test_block( $attributes ) {
		return wp_json_encode( $attributes );
	}

	/**
	 * Check that the route was registered properly.
	 *
	 * @covers WP_REST_Block_Renderer_Controller::register_routes()
	 */
	public function test_register_routes() {
		$dynamic_block_names = get_dynamic_block_names();
		$this->assertContains( self::$block_name, $dynamic_block_names );

		$routes = $this->server->get_routes();
		foreach ( $dynamic_block_names as $dynamic_block_name ) {
			$this->assertArrayHasKey( "/gutenberg/v1/block-renderer/(?P<name>$dynamic_block_name)", $routes );
		}
	}

	/**
	 * Test getting item without permissions.
	 *
	 * @covers WP_REST_Block_Renderer_Controller::get_item()
	 */
	public function test_get_item_without_permissions() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', '/gutenberg/v1/block-renderer/' . self::$block_name );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'gutenberg_block_cannot_read', $response, rest_authorization_required_code() );
	}

	/**
	 * Test getting item with invalid block name.
	 *
	 * @covers WP_REST_Block_Renderer_Controller::get_item()
	 */
	public function test_get_item_invalid_block_name() {
		wp_set_current_user( self::$user_id );
		$request  = new WP_REST_Request( 'GET', '/gutenberg/v1/block-renderer/core/123' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_no_route', $response, 404 );
	}

	/**
	 * Check getting item with an invalid param provided.
	 *
	 * @covers WP_REST_Block_Renderer_Controller::get_item()
	 */
	public function test_get_item_invalid_attribute() {
		wp_set_current_user( self::$user_id );
		$request = new WP_REST_Request( 'GET', '/gutenberg/v1/block-renderer/' . self::$block_name );
		$request->set_param( 'attributes', array(
			'some_string' => array( 'no!' ),
		) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
	}

	/**
	 * Check getting item with an invalid param provided.
	 *
	 * @covers WP_REST_Block_Renderer_Controller::get_item()
	 */
	public function test_get_item_unrecognized_attribute() {
		wp_set_current_user( self::$user_id );
		$request = new WP_REST_Request( 'GET', '/gutenberg/v1/block-renderer/' . self::$block_name );
		$request->set_param( 'attributes', array(
			'unrecognized' => 'yes',
		) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
	}

	/**
	 * Check getting item with default attributes provided.
	 *
	 * @covers WP_REST_Block_Renderer_Controller::get_item()
	 */
	public function test_get_item_default_attributes() {
		wp_set_current_user( self::$user_id );

		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( self::$block_name );
		$defaults   = array();
		foreach ( $block_type->attributes as $key => $attribute ) {
			$defaults[ $key ] = isset( $attribute['default'] ) ? $attribute['default'] : null;
		}

		$request = new WP_REST_Request( 'GET', '/gutenberg/v1/block-renderer/' . self::$block_name );
		$request->set_param( 'attributes', array() );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertEquals( $defaults, json_decode( $data['rendered'], true ) );
		$this->assertEquals(
			json_decode( $block_type->render( $defaults ) ),
			json_decode( $data['rendered'] )
		);
	}

	/**
	 * Check getting item with attributes provided.
	 *
	 * @covers WP_REST_Block_Renderer_Controller::get_item()
	 */
	public function test_get_item() {
		wp_set_current_user( self::$user_id );

		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( self::$block_name );
		$attributes = array(
			'some_int'    => '123',
			'some_string' => 'foo',
			'some_array'  => array( 1, '2', 3 ),
		);

		$expected_attributes               = $attributes;
		$expected_attributes['some_int']   = (int) $expected_attributes['some_int'];
		$expected_attributes['some_array'] = array_map( 'intval', $expected_attributes['some_array'] );

		$request = new WP_REST_Request( 'GET', '/gutenberg/v1/block-renderer/' . self::$block_name );
		$request->set_param( 'attributes', $attributes );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertEquals( $expected_attributes, json_decode( $data['rendered'], true ) );
		$this->assertEquals(
			json_decode( $block_type->render( $attributes ), true ),
			json_decode( $data['rendered'], true )
		);
	}

	/**
	 * Get item schema.
	 *
	 * @covers WP_REST_Block_Renderer_Controller::get_item_schema()
	 */
	public function test_get_item_schema() {
		$request  = new WP_REST_Request( 'OPTIONS', '/gutenberg/v1/block-renderer/' . self::$block_name );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEqualSets( array( 'GET' ), $data['endpoints'][0]['methods'] );
		$this->assertEqualSets(
			array( 'name', 'context', 'attributes' ),
			array_keys( $data['endpoints'][0]['args'] )
		);
		$this->assertEquals( 'object', $data['endpoints'][0]['args']['attributes']['type'] );

		$this->assertArrayHasKey( 'schema', $data );
		$this->assertEquals( 'rendered-block', $data['schema']['title'] );
		$this->assertEquals( 'object', $data['schema']['type'] );
		$this->arrayHasKey( 'rendered', $data['schema']['properties'] );
		$this->arrayHasKey( 'string', $data['schema']['properties']['rendered']['type'] );
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
	public function test_get_items() {
		$this->markTestSkipped();
	}

	/**
	 * NA.
	 */
	public function test_context_param() {
		$this->markTestIncomplete();
	}

	/**
	 * NA.
	 */
	public function test_prepare_item() {
		$this->markTestSkipped();
	}
}
