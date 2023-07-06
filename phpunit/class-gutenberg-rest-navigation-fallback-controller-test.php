<?php
/**
 * Unit tests covering Gutenberg_REST_Navigation_Fallback_Controller functionality.
 *
 * Note: that these tests are designed to provide high level coverage only. The majority of the tests
 * are made directly against the WP_Navigation_Fallback_Gutenberg class as this:
 *
 * - is where the bulk of the logic is.
 * - is also consumed by the Navigation block's server side rendering.
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi
 * @group navigation
 */
class Gutenberg_REST_Navigation_Fallback_Controller_Test extends WP_Test_REST_Controller_Testcase {

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
	 * @covers WP_REST_Navigation_Fallback_Controller::register_routes
	 *
	 * @since 6.3.0 Added Navigation Fallbacks endpoint.
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/wp-block-editor/v1/navigation-fallback', $routes, 'Fallback route should be registered.' );
	}

	/**
	 * @covers WP_REST_Navigation_Fallback_Controller
	 *
	 * @since 6.3.0 Added Navigation Fallbacks endpoint.
	 */
	public function test_should_not_return_menus_for_users_without_permissions() {

		wp_set_current_user( self::$editor_user );

		$request  = new WP_REST_Request( 'GET', '/wp-block-editor/v1/navigation-fallback' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 403, $response->get_status(), 'Response should indicate user does not have permission.' );

		$this->assertEquals( 'rest_cannot_create', $data['code'], 'Response should indicate user cannot create.' );

		$this->assertEquals( 'Sorry, you are not allowed to create Navigation Menus as this user.', $data['message'], 'Response should indicate failed request status.' );
	}

	/**
	 * @covers WP_REST_Navigation_Fallback_Controller
	 *
	 * @since 6.3.0 Added Navigation Fallbacks endpoint.
	 */
	public function test_get_item() {

		$request  = new WP_REST_Request( 'GET', '/wp-block-editor/v1/navigation-fallback' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status(), 'Status should indicate successful request.' );

		$this->assertIsArray( $data, 'Response should be of correct type.' );

		$this->assertArrayHasKey( 'id', $data, 'Response should contain expected fields.' );

		$this->assertEquals( 'wp_navigation', get_post_type( $data['id'] ), '"id" field should represent a post of type "wp_navigation"' );

		// Check that only a single Navigation fallback was created.
		$navs_in_db = $this->get_navigations_in_database();

		$this->assertCount( 1, $navs_in_db, 'Only a single Navigation menu should be present in the database.' );

	}

	/**
	 * @covers WP_REST_Navigation_Fallback_Controller
	 *
	 * @since 6.3.0 Added Navigation Fallbacks endpoint.
	 */
	public function test_get_item_schema() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp-block-editor/v1/navigation-fallback' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status(), 'Status should indicate successful request.' );

		$this->assertArrayHasKey( 'schema', $data, '"schema" key should exist in response.' );

		$schema = $data['schema'];

		$this->assertEquals( 'object', $schema['type'], 'The schema type should match the expected type.' );

		$this->assertArrayHasKey( 'id', $schema['properties'], 'Schema should have an "id" property.' );
		$this->assertEquals( 'integer', $schema['properties']['id']['type'], 'Schema "id" property should be an integer.' );
		$this->assertTrue( $schema['properties']['id']['readonly'], 'Schema "id" property should be readonly.' );
	}

	/**
	 * @covers WP_REST_Navigation_Fallback_Controller
	 *
	 * @since 6.3.0 Added Navigation Fallbacks endpoint.
	 */
	public function test_adds_links() {
		$request  = new WP_REST_Request( 'GET', '/wp-block-editor/v1/navigation-fallback' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$navigation_post_id = $data['id'];

		$links = $response->get_links();

		$this->assertNotEmpty( $links, 'Response should contain links.' );

		$this->assertArrayHasKey( 'self', $links, 'Response should contain a "self" link.' );

		$this->assertStringContainsString( 'wp/v2/navigation/' . $navigation_post_id, $links['self'][0]['href'], 'Self link should reference the correct Navigation Menu post resource url.' );

		$this->assertTrue( $links['self'][0]['attributes']['embeddable'], 'Self link should be embeddable.' );
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
}
