<?php
/**
 * Unit tests covering WP_REST_Navigation_Fallbacks_Controller functionality.
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi
 * @group navigation
 */
class WP_REST_Navigation_Fallbacks_Controller_Test extends WP_Test_REST_Controller_Testcase {

	protected static $admin_user;
	protected static $editor_user;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_user = $factory->user->create( array( 'role' => 'administrator' ) );

		self::$editor_user = $factory->user->create( array( 'role' => 'editor' ) );
	}

	public function set_up() {
		parent::set_up();

		wp_set_current_user( self::$admin_user );
	}

	/**
	 * @covers WP_REST_Navigation_Fallbacks_Controller::register_routes
	 *
	 * @since 5.8.0
	 * @since 6.2.0 Added pattern directory categories endpoint.
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/wp-block-editor/v1/navigation-fallbacks', $routes );
	}

	public function test_should_not_return_menus_for_users_without_permissions() {

		wp_set_current_user( self::$editor_user );

		$request  = new WP_REST_Request( 'GET', '/wp-block-editor/v1/navigation-fallbacks' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 403, $response->get_status() );

		$this->assertEquals( 'rest_cannot_create', $data['code'] );

		$this->assertEquals( 'Sorry, you are not allowed to create Navigation Menus as this user.', $data['message'] );
	}

	private function get_navigations_in_database() {
		$navs_in_db = new WP_Query(
			array(
				'post_type'      => 'wp_navigation',
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'orderby'        => 'date',
				'order'          => 'DESC',
			)
		);

		return $navs_in_db->posts ? $navs_in_db->posts : array();
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {
		// Covered by the core test.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// Covered by the core test.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_items() {
		// Covered by the core test.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item() {
		// Controller does not implement get_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {
		// Controller does not implement create_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// Controller does not implement update_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// Controller does not implement delete_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item_schema() {
		// The controller's schema is hardcoded, so tests would not be meaningful.
	}

}
