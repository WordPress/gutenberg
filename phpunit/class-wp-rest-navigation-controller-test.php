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

	public function test_it_should_create_and_return_a_default_fallback_navigation_menu_in_absence_of_other_fallbacks() {
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

	public function test_it_should_return_the_most_recently_created_navigation_menu_if_one_exists() {

		// Pre-add a Navigation Menu to simulate when a user already has a menu.
		self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu 1',
				'post_content' => '<!-- wp:page-list /-->',
			)
		);

		$most_recently_published_nav = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu 2',
				'post_content' => '<!-- wp:navigation-link {"label":"Hello world","type":"post","id":1,"url":"/hello-world","kind":"post-type"} /-->',
			)
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/navigation/fallbacks' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );

		$this->assertInstanceOf( 'WP_Post', $data );

		$this->assertEquals( $most_recently_published_nav->post_title, $data->post_title, 'Post title should be the same as the most recently created menu.' );

		$this->assertEquals( $most_recently_published_nav->post_name, $data->post_name, 'Post name should be the same as the most recently created menu.' );

		$this->assertEquals( $most_recently_published_nav->post_content, $data->post_content, 'Post content should be the same as the most recently created menu.' );

		// Check that no new Navigation menu was created.
		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 2, $navs_in_db, 'Only the existing Navigation menus should be present in the database.' );
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
