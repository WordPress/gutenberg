<?php
/**
 * Unit tests covering WP_REST_Navigation_Controller functionality.
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi
 * @group navigation
 */
class WP_REST_Navigation_Controller_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * @covers WP_REST_Navigation_Controller::register_routes
	 *
	 * @since 5.8.0
	 * @since 6.2.0 Added pattern directory categories endpoint.
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/wp/v2/navigation/fallbacks', $routes );
	}

	public function test_it_should_create_default_fallback_when_there_are_no_other_fallbacks() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/navigation/fallbacks' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );

        $this->assertInstanceOf( 'WP_Post', $data );

		$this->assertEquals( 'wp_navigation', $data->post_type, 'Post type should be `wp_navigation`' );

		$this->assertEquals( 'Navigation', $data->post_title, 'Post title should be the default title' );

		$this->assertEquals( 'navigation', $data->post_name, 'Post name should be the default slug' );

		$navs_in_db = $this->get_navigations_in_database();

		$this->assertCount( 1, $navs_in_db, 'The fallback Navigation post should be the only one in the database.' );
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
