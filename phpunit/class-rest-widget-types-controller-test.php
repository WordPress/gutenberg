<?php
/**
 * WP_REST_Widget_Types_Controller tests.
 *
 * @package WordPress
 * @subpackage REST_API
 * @since x.x.0
 */

/**
 * Tests for WP_REST_Widget_Types_Controller.
 *
 * @since x.x.0
 *
 * @covers WP_REST_Widget_Types_Controller
 *
 * @group restapi-widgets
 * @group restapi
 */
class REST_Widget_Types_Controller_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * Admin user ID.
	 *
	 * @since x.x.0
	 *
	 * @var int $subscriber_id
	 */
	protected static $admin_id;

	/**
	 * Subscriber user ID.
	 *
	 * @since x.x.0
	 *
	 * @var int $subscriber_id
	 */
	protected static $subscriber_id;

	/**
	 * Create fake data before our tests run.
	 *
	 * @since x.x.0
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
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
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$subscriber_id );
	}

	/**
	 *
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/widget-types', $routes );
		$this->assertCount( 1, $routes['/wp/v2/widget-types'] );
		$this->assertArrayHasKey( '/wp/v2/widget-types/(?P<name>[a-zA-Z0-9_-]+)', $routes );
		$this->assertCount( 1, $routes['/wp/v2/widget-types/(?P<name>[a-zA-Z0-9_-]+)'] );
		$this->assertArrayHasKey( '/wp/v2/widget-types/(?P<name>[a-zA-Z0-9_-]+)/form-renderer', $routes );
		$this->assertCount( 1, $routes['/wp/v2/widget-types/(?P<name>[a-zA-Z0-9_-]+)/form-renderer'] );
	}

	/**
	 *
	 */
	public function test_context_param() {
		// Collection.
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/widget-types' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertSame( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
		// Single.
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/widget-types/calendar' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertSame( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	/**
	 *
	 */
	public function test_get_items() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/widget-types' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertGreaterThan( 1, count( $data ) );
		$endpoint = new WP_REST_Widget_Types_Controller;
		foreach ( $data as $item ) {
			$widget_type = $endpoint->get_widget( $item['name'] );
			$this->check_widget_type_object( $widget_type, $item, $item['_links'] );
		}

	}

	/**
	 *
	 */
	public function test_get_item() {
		$widget_name = 'calendar';
		wp_set_current_user( self::$admin_id );
		$request     = new WP_REST_Request( 'GET', '/wp/v2/widget-types/' . $widget_name );
		$response    = rest_get_server()->dispatch( $request );
		$endpoint    = new WP_REST_Widget_Types_Controller;
		$widget_type = $endpoint->get_widget( $widget_name );
		$this->check_widget_type_object( $widget_type, $response->get_data(), $response->get_links() );
	}

	/**
	 *
	 */
	public function test_get_widget_legacy() {
		$widget_id = 'legacy';
		wp_register_sidebar_widget(
			$widget_id,
			'WP legacy widget',
			function() {}
		);
		wp_set_current_user( self::$admin_id );
		$request     = new WP_REST_Request( 'GET', '/wp/v2/widget-types/' . $widget_id );
		$response    = rest_get_server()->dispatch( $request );
		$endpoint    = new WP_REST_Widget_Types_Controller;
		$widget_type = $endpoint->get_widget( $widget_id );
		$this->check_widget_type_object( $widget_type, $response->get_data(), $response->get_links() );
	}

	/**
	 *
	 */
	public function test_get_widget_invalid_name() {
		$widget_type = 'fake';
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/widget-types/' . $widget_type );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_widget_type_invalid', $response, 404 );
	}

	/**
	 *
	 */
	public function test_get_item_schema() {
		wp_set_current_user( self::$admin_id );
		$request    = new WP_REST_Request( 'OPTIONS', '/wp/v2/widget-types' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertCount( 7, $properties );

		$this->assertArrayHasKey( 'name', $properties );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'option_name', $properties );
		$this->assertArrayHasKey( 'description', $properties );
		$this->assertArrayHasKey( 'classname', $properties );
		$this->assertArrayHasKey( 'customize_selective_refresh', $properties );
		$this->assertArrayHasKey( 'widget_class', $properties );
	}

	/**
	 *
	 */
	public function test_get_items_wrong_permission() {
		wp_set_current_user( self::$subscriber_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/widget-types' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 403 );
	}

	/**
	 *
	 */
	public function test_get_item_wrong_permission() {
		wp_set_current_user( self::$subscriber_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/widget-types/calendar' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 403 );
	}

	/**
	 *
	 */
	public function test_get_items_no_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/widget-types' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 401 );
	}

	/**
	 *
	 */
	public function test_get_item_no_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/widget-types/calendar' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 401 );
	}

	/**
	 *
	 */
	public function test_prepare_item() {
		$endpoint    = new WP_REST_Widget_Types_Controller;
		$widget_type = $endpoint->get_widget( 'calendar' );
		$request     = new WP_REST_Request;
		$request->set_param( 'context', 'edit' );
		$response = $endpoint->prepare_item_for_response( $widget_type, $request );
		$this->check_widget_type_object( $widget_type, $response->get_data(), $response->get_links() );
	}

	/**
	 * Util check widget type object against.
	 *
	 * @since x.x.0
	 *
	 * @param WP_Widget_Type $widget_type Sample widget type.
	 * @param array          $data Data to compare against.
	 * @param array          $links Links to compare again.
	 */
	protected function check_widget_type_object( $widget_type, $data, $links ) {
		// Test data.
		$extra_fields = array(
			'name',
			'id_base',
			'option_name',
			'control_options',
			'widget_options',
			'widget_class',

		);

		foreach ( $extra_fields as $extra_field ) {
			if ( isset( $widget_type->$extra_field ) ) {
				$this->assertSame( $data[ $extra_field ], $widget_type->$extra_field, 'Field ' . $extra_field );
			}
		}

		// Test links.
		$this->assertSame( rest_url( 'wp/v2/widget-types' ), $links['collection'][0]['href'] );
		// $this->assertSame( rest_url( 'wp/v2/widget-types/' . $widget_type->id_base ), $links['self'][0]['href'] );
	}

	public function test_get_widget_form() {
		$widget_name = 'calendar';
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'POST', '/wp/v2/widget-types/' . $widget_name . '/form-renderer' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertArrayHasKey( 'instance', $data );
		$this->assertArrayHasKey( 'form', $data );
	}

	/**
	 * The test_create_item() method does not exist for widget types.
	 */
	public function test_create_item() {}

	/**
	 * The test_update_item() method does not exist for widget types.
	 */
	public function test_update_item() {}

	/**
	 * The test_delete_item() method does not exist for widget types.
	 */
	public function test_delete_item() {}
}
