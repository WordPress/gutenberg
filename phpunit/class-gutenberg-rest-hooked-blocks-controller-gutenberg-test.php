<?php
/**
 * Unit tests covering Gutenberg_REST_Hooked_Blocks_Controller_6_5 functionality.
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.5.0
 *
 * @covers WP_REST_Block_Types_Controller
 *
 * @group restapi-blocks
 * @group restapi
 */
class Gutenberg_REST_Hooked_Blocks_Controller_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * Admin user ID.
	 *
	 * @since 6.5.0
	 *
	 * @var int $subscriber_id
	 */
	protected static $admin_id;

	/**
	 * Subscriber user ID.
	 *
	 * @since 6.5.0
	 *
	 * @var int $subscriber_id
	 */
	protected static $subscriber_id;

	/**
	 * Create fake data before our tests run.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id      = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		self::$subscriber_id = $factory->user->create(
			array(
				'role' => 'subscriber',
			)
		);

		$anchor_block_settings = array(
			'icon' => 'text',
		);

		$hooked_block_settings = array(
			'block_hooks' => array(
				'fake/anchor-block' => 'after',
			)
		);

		register_block_type( 'fake/anchor-block', $anchor_block_settings );
		register_block_type( 'fake/hooked-block', $hooked_block_settings );

		$other_hooked_block_settings = array(
			'block_hooks' => array(
				'fake/other-anchor-block' => 'first_child',
			)
		);

		register_block_type( 'fake/other-anchor-block', array() );
		register_block_type( 'fake/other-hooked-block', $other_hooked_block_settings );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$subscriber_id );
		unregister_block_type( 'fake/anchor-block' );
		unregister_block_type( 'fake/hooked-block' );
		unregister_block_type( 'fake/other-anchor-block' );
		unregister_block_type( 'fake/other-hooked-block' );
	}

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/hooked-blocks', $routes );
		$this->assertCount( 1, $routes['/wp/v2/hooked-blocks'] );
		$this->assertArrayHasKey( '/wp/v2/hooked-blocks/(?P<namespace>[a-zA-Z0-9_-]+)', $routes );
		$this->assertCount( 1, $routes['/wp/v2/hooked-blocks/(?P<namespace>[a-zA-Z0-9_-]+)'] );
		$this->assertArrayHasKey( '/wp/v2/hooked-blocks/(?P<namespace>[a-zA-Z0-9_-]+)/(?P<name>[a-zA-Z0-9_-]+)', $routes );
		$this->assertCount( 1, $routes['/wp/v2/hooked-blocks/(?P<namespace>[a-zA-Z0-9_-]+)/(?P<name>[a-zA-Z0-9_-]+)'] );
	}

	public function test_context_param() {
		// Collection.
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/hooked-blocks' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertSame( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
		// Single.
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/hooked-blocks/fake/test' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertSame( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	public function test_get_items() {
		$block_name = 'fake/test';
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/hooked-blocks/fake' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertCount( 2, $data );
		$this->assertSame( $data, array(
			'fake/anchor-block' => array(
				'after' => array( 'fake/hooked-block' )
			),
			'fake/other-anchor-block' => array(
				'first_child' => array( 'fake/other-hooked-block' )
			),
		) );
	}

	public function test_get_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/hooked-blocks/fake/anchor-block' );
		$response = rest_get_server()->dispatch( $request );
		$data	  = $response->get_data();
		$this->assertSame( $data, array(
			'after' => array( 'fake/hooked-block' )
		) );
	}

	public function test_get_item_with_no_hooked_blocks() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/hooked-blocks/fake/hooked-block' );
		$response = rest_get_server()->dispatch( $request );
		$data	  = $response->get_data();
		$this->assertSame( $data, array() );
	}

	public function test_get_item_with_hooked_block_added_by_filter() {
		$add_hooked_block = function( $hooked_block_types, $relative_position, $anchor_block_type ) {
			if ( 'last_child' === $relative_position && 'fake/anchor-block' === $anchor_block_type ) {
				$hooked_block_types[] = 'fake/hooked-block-added-by-filter';
			}
			return $hooked_block_types;
		};
		add_filter( 'hooked_block_types', $add_hooked_block, 10, 3 );

		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/hooked-blocks/fake/anchor-block' );
		$response = rest_get_server()->dispatch( $request );
		$data	  = $response->get_data();

		remove_filter( 'hooked_block_types', $add_hooked_block, 10 );
		$this->assertSame( $data, array(
			'after'      => array( 'fake/hooked-block' ),
			'last_child' => array( 'fake/hooked-block-added-by-filter' )
		) );
	}

	public function test_get_block_invalid_name() {
		$block_type = 'fake/block';
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/hooked-blocks/' . $block_type );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_block_type_invalid', $response, 404 );
	}

	public function test_get_item_schema() {
		wp_set_current_user( self::$admin_id );
		$request    = new WP_REST_Request( 'OPTIONS', '/wp/v2/hooked-blocks' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertCount( 1, $properties );
		$this->assertArrayHasKey( 'block_name', $properties );
	}

	public function test_get_items_wrong_permission() {
		wp_set_current_user( self::$subscriber_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/hooked-blocks' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_block_type_cannot_view', $response, 403 );
	}

	public function test_get_item_wrong_permission() {
		wp_set_current_user( self::$subscriber_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/hooked-blocks/fake/test' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_block_type_cannot_view', $response, 403 );
	}

	public function test_get_items_no_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/hooked-blocks' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_block_type_cannot_view', $response, 401 );
	}

	public function test_get_item_no_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/hooked-blocks/fake/test' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_block_type_cannot_view', $response, 401 );
	}

	public function test_prepare_item() {
		$registry = new WP_Block_Type_Registry();
		$settings = array(
			'icon'            => 'text',
			'render_callback' => '__return_null',
		);
		$registry->register( 'fake/line', $settings );
		$block_type = $registry->get_registered( 'fake/line' );
		$endpoint   = new WP_REST_Block_Types_Controller();
		$request    = new WP_REST_Request();
		$request->set_param( 'context', 'edit' );
		$response = $endpoint->prepare_item_for_response( $block_type, $request );
		// $this->assertSame();
	}

	public function test_prepare_item_limit_fields() {
		$registry = new WP_Block_Type_Registry();
		$settings = array(
			'icon'            => 'text',
			'render_callback' => '__return_null',
		);
		$registry->register( 'fake/line', $settings );
		$block_type = $registry->get_registered( 'fake/line' );
		$request    = new WP_REST_Request();
		$endpoint   = new WP_REST_Block_Types_Controller();
		$request->set_param( 'context', 'edit' );
		$request->set_param( '_fields', 'name' );
		$response = $endpoint->prepare_item_for_response( $block_type, $request );
		$this->assertSame(
			array(
				'name',
			),
			array_keys( $response->get_data() )
		);
	}

	/**
	 * The create_item() method does not exist for hooked blocks.
	 *
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {
		// Controller does not implement create_item().
	}

	/**
	 * The update_item() method does not exist for hooked blocks.
	 *
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// Controller does not implement create_item().
	}

	/**
	 * The delete_item() method does not exist for hooked blocks.
	 *
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// Controller does not implement delete_item().
	}
}
