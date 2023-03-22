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

	public function test_get_fallbacks() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/navigation/fallbacks' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		/**
			{
		"ID": 65,
		"post_author": "1",
		"post_date": "2023-03-21 15:26:23",
		"post_date_gmt": "2023-03-21 15:26:23",
		"post_content": "<!-- wp:navigation-link {\"label\":\"Sample Page\",\"type\":\"page\",\"id\":2,\"url\":\"http://localhost:8888/sample-page/\",\"kind\":\"post-type\"} /-->\n\n<!-- wp:navigation-submenu {\"label\":\"Sample Page\",\"type\":\"page\",\"id\":2,\"url\":\"http://localhost:8888/sample-page/\",\"kind\":\"post-type\"} -->\n<!-- wp:navigation-link {\"label\":\"Duotone\",\"type\":\"post\",\"id\":46,\"url\":\"http://localhost:8888/46-2/\",\"kind\":\"post-type\"} /-->\n<!-- /wp:navigation-submenu -->",
		"post_title": "Header navigation",
		"post_excerpt": "",
		"post_status": "publish",
		"comment_status": "closed",
		"ping_status": "closed",
		"post_password": "",
		"post_name": "header-navigation",
		"to_ping": "",
		"pinged": "",
		"post_modified": "2023-03-21 15:26:52",
		"post_modified_gmt": "2023-03-21 15:26:52",
		"post_content_filtered": "",
		"post_parent": 0,
		"guid": "http://localhost:8888/?p=65",
		"menu_order": 0,
		"post_type": "wp_navigation",
		"post_mime_type": "",
		"comment_count": "0",
		"filter": "raw"
	}
 */


		$this->assertEquals( 200, $response->get_status() );
        $this->assertInstanceOf( 'WP_Post', $data );

        // assert $data has a post_type property of `wp_navigation`
        $this->assertEquals( 'wp_navigation', $data->post_type );

		// echo "<pre>";
        // var_dump($data);
        // echo "</pre>";

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
