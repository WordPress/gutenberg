<?php
/**
 * REST API: REST_WP_REST_Block_Types_Controller_Test class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Tests for REST API for block types
 *
 * @see WP_Test_REST_Post_Type_Controller_Testcase
 */
class REST_WP_REST_Block_Types_Controller_Test extends WP_Test_REST_Post_Type_Controller_Testcase {

	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		$name           = 'fake/test';
		$settings       = array(
			'icon' => 'text',
		);

		register_block_type( $name, $settings );
	}

	/**
	 *
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		unregister_block_type( 'fake/test' );
	}

	/**
	 *
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/__experimental/block-types', $routes );
		$this->assertCount( 1, $routes['/__experimental/block-types'] );
		$this->assertArrayHasKey( '/__experimental/block-types/(?P<namespace>[a-zA-Z0-9_-]+)', $routes );
		$this->assertCount( 1, $routes['/__experimental/block-types/(?P<namespace>[a-zA-Z0-9_-]+)'] );
		$this->assertArrayHasKey( '/__experimental/block-types/(?P<namespace>[a-zA-Z0-9_-]+)/(?P<name>[a-zA-Z0-9_-]+)', $routes );
		$this->assertCount( 1, $routes['/__experimental/block-types/(?P<namespace>[a-zA-Z0-9_-]+)/(?P<name>[a-zA-Z0-9_-]+)'] );
	}

	/**
	 *
	 */
	public function test_context_param() {
		// Collection.
		$request  = new WP_REST_Request( 'OPTIONS', '/__experimental/block-types' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
		$menu = 'primary';
		$this->register_nav_menu_locations( array( $menu ) );
		$request  = new WP_REST_Request( 'OPTIONS', '/__experimental/block-types/' . $menu );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	/**
	 *
	 */
	public function test_get_items() {
		register_block_type( 'test/block-1', [] );
		register_block_type( 'test/block-2', [] );
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/__experimental/block-types/test' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$data     = array_values( $data );
		$this->assertCount( 2, $data );
		$names        = wp_list_pluck( $data, 'name' );
		$this->assertEqualSets( array('test/block-1', 'test/block-2'), $names );
		unregister_block_type('test/block-1');
		unregister_block_type('test/block-2');
	}

	/**
	 *
	 */
	public function test_get_item() {
		$block_type = 'fake/test';
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/__experimental/block-types/' . $block_type );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( $block_type, $data['name'] );
	}

	/**
	 *
	 */
	public function test_get_item_schema() {
		wp_set_current_user( self::$admin_id );
		$request    = new WP_REST_Request( 'OPTIONS', '/__experimental/block-types' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertEquals( 9, count( $properties ) );
		$this->assertArrayHasKey( 'name', $properties );
		$this->assertArrayHasKey( 'attributes', $properties );
		$this->assertArrayHasKey( 'supports', $properties );
		$this->assertArrayHasKey( 'category', $properties );
		$this->assertArrayHasKey( 'is_dynamic', $properties );
		$this->assertArrayHasKey( 'editor_script', $properties );
		$this->assertArrayHasKey( 'script', $properties );
		$this->assertArrayHasKey( 'editor_style', $properties );
		$this->assertArrayHasKey( 'style', $properties );
	}

	/**
	 * The test_create_item() method does not exist for block types.
	 */
	public function test_create_item() {}

	/**
	 * The test_update_item() method does not exist for block types.
	 */
	public function test_update_item() {}

	/**
	 * The test_delete_item() method does not exist for block types.
	 */
	public function test_delete_item() {}

	/**
	 * The test_prepare_item() method does not exist for block types.
	 */
	public function test_prepare_item() {}
}
