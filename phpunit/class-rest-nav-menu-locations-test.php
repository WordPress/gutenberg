<?php
/**
 * REST API: REST_Nav_Menu_Locations_Test class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Tests for REST API for Menu locations.
 *
 * @see WP_Test_REST_Controller_Testcase
 */
class REST_Nav_Menu_Locations_Test extends WP_Test_REST_Controller_Testcase {

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
	}

	/**
	 * Set up.
	 */
	public function setUp() {
		parent::setUp();

		// Unregister all nav menu locations.
		foreach ( array_keys( get_registered_nav_menus() ) as $location ) {
			unregister_nav_menu( $location );
		}
	}

	/**
	 * Register nav menu locations.
	 *
	 * @param array $locations Location slugs.
	 */
	public function register_nav_menu_locations( $locations ) {
		foreach ( $locations as $location ) {
			register_nav_menu( $location, ucfirst( $location ) );
		}
	}

	/**
	 *
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/__experimental/menu-locations', $routes );
		$this->assertCount( 1, $routes['/__experimental/menu-locations'] );
		$this->assertArrayHasKey( '/__experimental/menu-locations/(?P<location>[\w-]+)', $routes );
		$this->assertCount( 1, $routes['/__experimental/menu-locations/(?P<location>[\w-]+)'] );
	}

	/**
	 *
	 */
	public function test_context_param() {
		// Collection.
		$request  = new WP_REST_Request( 'OPTIONS', '/__experimental/menu-locations' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
		$menu = 'primary';
		$this->register_nav_menu_locations( array( $menu ) );
		$request  = new WP_REST_Request( 'OPTIONS', '/__experimental/menu-locations/' . $menu );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	/**
	 *
	 */
	public function test_get_items() {
		$menus = array( 'primary', 'secondary' );
		$this->register_nav_menu_locations( array( 'primary', 'secondary' ) );
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/__experimental/menu-locations' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$data     = array_values( $data );
		$this->assertCount( 2, $data );
		$names        = wp_list_pluck( $data, 'name' );
		$descriptions = wp_list_pluck( $data, 'description' );
		$this->assertEquals( $menus, $names );
		$menu_descriptions = array_map( 'ucfirst', $names );
		$this->assertEquals( $menu_descriptions, $descriptions );
	}

	/**
	 *
	 */
	public function test_get_item() {
		$menu = 'primary';
		$this->register_nav_menu_locations( array( $menu ) );

		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/__experimental/menu-locations/' . $menu );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( $menu, $data['name'] );
	}

	/**
	 * The test_create_item() method does not exist for menu locations.
	 */
	public function test_create_item() {}

	/**
	 * The test_update_item() method does not exist for menu locations.
	 */
	public function test_update_item() {}

	/**
	 * The test_delete_item() method does not exist for menu locations.
	 */
	public function test_delete_item() {}

	/**
	 * The test_prepare_item() method does not exist for menu locations.
	 */
	public function test_prepare_item() {}

	/**
	 *
	 */
	public function test_get_item_schema() {
		wp_set_current_user( self::$admin_id );
		$request    = new WP_REST_Request( 'OPTIONS', '/__experimental/menu-locations' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertEquals( 3, count( $properties ) );
		$this->assertArrayHasKey( 'name', $properties );
		$this->assertArrayHasKey( 'description', $properties );
		$this->assertArrayHasKey( 'menu', $properties );
	}


	/**
	 *
	 */
	public function test_get_item_menu_location_context_without_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/__experimental/menu-locations' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_view', $response, rest_authorization_required_code() );
	}

	/**
	 *
	 */
	public function test_get_items_menu_location_context_without_permission() {
		$menu = 'primary';
		$this->register_nav_menu_locations( array( $menu ) );

		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/__experimental/menu-locations/' . $menu );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_view', $response, rest_authorization_required_code() );
	}
}
