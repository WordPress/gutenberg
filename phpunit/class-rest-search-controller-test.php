<?php
/**
 * WP_REST_Search_Controller tests
 *
 * @package gutenberg
 */

/**
 * Tests for WP_REST_Search_Controller.
 */
class REST_Search_Controller_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * Posts with title 'my-footitle'.
	 *
	 * @var array
	 */
	private static $my_title_post_ids = array();

	/**
	 * Pages with title 'my-footitle'.
	 *
	 * @var array
	 */
	private static $my_title_page_ids = array();

	/**
	 * Posts with content 'my-foocontent'.
	 *
	 * @var array
	 */
	private static $my_content_post_ids = array();

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$my_title_post_ids = $factory->post->create_many( 4, array(
			'post_title' => 'my-footitle',
			'post_type'  => 'post',
		) );

		self::$my_title_page_ids = $factory->post->create_many( 4, array(
			'post_title' => 'my-footitle',
			'post_type'  => 'page',
		) );

		self::$my_content_post_ids = $factory->post->create_many( 6, array(
			'post_content' => 'my-foocontent',
		) );
	}

	/**
	 * Delete our fake data after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		$post_ids = array_merge(
			self::$my_title_post_ids,
			self::$my_title_page_ids,
			self::$my_content_post_ids
		);

		foreach ( $post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}
	}

	/**
	 * Check that our routes get set up properly.
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/gutenberg/v1/search', $routes );
		$this->assertCount( 1, $routes['/gutenberg/v1/search'] );
	}

	/**
	 * Check the context parameter.
	 */
	public function test_context_param() {
		$response = $this->do_request_with_params( array(), 'OPTIONS' );
		$data     = $response->get_data();

		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	/**
	 * Search through all content.
	 */
	public function test_get_items() {
		$response = $this->do_request_with_params( array(
			'per_page' => 100,
		) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEqualSets(
			array_merge(
				self::$my_title_post_ids,
				self::$my_title_page_ids,
				self::$my_content_post_ids
			),
			wp_list_pluck( $response->get_data(), 'id' )
		);
	}

	/**
	 * Search through all content with a low limit.
	 */
	public function test_get_items_with_limit() {
		$response = $this->do_request_with_params( array(
			'per_page' => 3,
		) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 3, count( $response->get_data() ) );
	}

	/**
	 * Search through posts of any post type.
	 */
	public function test_get_items_search_type_post() {
		$response = $this->do_request_with_params( array(
			'per_page' => 100,
			'type'     => 'post',
		) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEqualSets(
			array_merge(
				self::$my_title_post_ids,
				self::$my_title_page_ids,
				self::$my_content_post_ids
			),
			wp_list_pluck( $response->get_data(), 'id' )
		);
	}

	/**
	 * Search through posts of post type 'post'.
	 */
	public function test_get_items_search_type_post_subtype_post() {
		$response = $this->do_request_with_params( array(
			'per_page' => 100,
			'type'     => 'post',
			'subtype'  => 'post',
		) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEqualSets(
			array_merge(
				self::$my_title_post_ids,
				self::$my_content_post_ids
			),
			wp_list_pluck( $response->get_data(), 'id' )
		);
	}

	/**
	 * Search through posts of post type 'page'.
	 */
	public function test_get_items_search_type_post_subtype_page() {
		$response = $this->do_request_with_params( array(
			'per_page' => 100,
			'type'     => 'post',
			'subtype'  => 'page',
		) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEqualSets(
			self::$my_title_page_ids,
			wp_list_pluck( $response->get_data(), 'id' )
		);
	}

	/**
	 * Search through an invalid type
	 */
	public function test_get_items_search_type_invalid() {
		$response = $this->do_request_with_params( array(
			'per_page' => 100,
			'type'     => 'invalid',
		) );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 * Search through posts of an invalid post type.
	 */
	public function test_get_items_search_type_post_subtype_invalid() {
		$response = $this->do_request_with_params( array(
			'per_page' => 100,
			'type'     => 'post',
			'subtype'  => 'invalid',
		) );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 * Search through posts and pages.
	 */
	public function test_get_items_search_posts_and_pages() {
		$response = $this->do_request_with_params( array(
			'per_page' => 100,
			'type'     => 'post',
			'subtype'  => 'post,page',
		) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEqualSets(
			array_merge(
				self::$my_title_post_ids,
				self::$my_title_page_ids,
				self::$my_content_post_ids
			),
			wp_list_pluck( $response->get_data(), 'id' )
		);
	}

	/**
	 * Search through all that matches a 'footitle' search.
	 */
	public function test_get_items_search_for_footitle() {
		$response = $this->do_request_with_params( array(
			'per_page' => 100,
			'search'   => 'footitle',
		) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEqualSets(
			array_merge(
				self::$my_title_post_ids,
				self::$my_title_page_ids
			),
			wp_list_pluck( $response->get_data(), 'id' )
		);
	}

	/**
	 * Search through all that matches a 'foocontent' search.
	 */
	public function test_get_items_search_for_foocontent() {
		$response = $this->do_request_with_params( array(
			'per_page' => 100,
			'search'   => 'foocontent',
		) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEqualSets(
			self::$my_content_post_ids,
			wp_list_pluck( $response->get_data(), 'id' )
		);
	}

	/**
	 * Test retrieving a single item isn't possible.
	 */
	public function test_get_item() {
		/** The search controller does not allow getting individual item content */
		$request  = new WP_REST_Request( 'GET', '/gutenberg/v1/search' . self::$my_title_post_ids[0] );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 404, $response->get_status() );
	}

	/**
	 * Test creating an item isn't possible.
	 */
	public function test_create_item() {
		/** The search controller does not allow creating content */
		$request  = new WP_REST_Request( 'POST', '/gutenberg/v1/search' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 404, $response->get_status() );
	}

	/**
	 * Test updating an item isn't possible.
	 */
	public function test_update_item() {
		/** The search controller does not allow upading content */
		$request  = new WP_REST_Request( 'POST', '/gutenberg/v1/search' . self::$my_title_post_ids[0] );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 404, $response->get_status() );
	}

	/**
	 * Test deleting an item isn't possible.
	 */
	public function test_delete_item() {
		/** The search controller does not allow deleting content */
		$request  = new WP_REST_Request( 'DELETE', '/gutenberg/v1/search' . self::$my_title_post_ids[0] );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 404, $response->get_status() );
	}

	/**
	 * Test preparing the data contains the correct fields.
	 */
	public function test_prepare_item() {
		$response = $this->do_request_with_params();
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( array(
			'id',
			'title',
			'url',
			'type',
			'subtype',
			'_links',
		), array_keys( $data[0] ) );
	}

	/**
	 * Test preparing the data with limited fields contains the correct fields.
	 */
	public function test_prepare_item_limit_fields() {
		if ( ! method_exists( 'WP_REST_Controller', 'get_fields_for_response' ) ) {
			$this->markTestSkipped( 'Limiting fields requires the WP_REST_Controller::get_fields_for_response() method.' );
		}

		$response = $this->do_request_with_params( array(
			'_fields' => 'id,title',
		) );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( array(
			'id',
			'title',
			'_links',
		), array_keys( $data[0] ) );
	}

	/**
	 * Tests the item schema is correct.
	 */
	public function test_get_item_schema() {
		$request    = new WP_REST_Request( 'OPTIONS', '/gutenberg/v1/search' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];

		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'title', $properties );
		$this->assertArrayHasKey( 'url', $properties );
		$this->assertArrayHasKey( 'type', $properties );
		$this->assertArrayHasKey( 'subtype', $properties );
	}

	/**
	 * Tests that non-public post types are not allowed.
	 */
	public function test_non_public_post_type() {
		$response = $this->do_request_with_params( array(
			'type'    => 'post',
			'subtype' => 'post,nav_menu_item',
		) );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 * Test getting items directly with a custom search handler.
	 */
	public function test_custom_search_handler_get_items() {
		$controller = new WP_REST_Search_Controller( array( new WP_REST_Dummy_Search_Handler( 10 ) ) );

		$request  = $this->get_request( array(
			'page'     => 1,
			'per_page' => 10,
			'type'     => 'dummy',
			'subtype'  => array( WP_REST_Search_Controller::TYPE_ANY ),
		) );
		$response = $controller->get_items( $request );
		$this->assertEqualSets( range( 1, 10 ), wp_list_pluck( $response->get_data(), 'id' ) );

		$request  = $this->get_request( array(
			'page'     => 1,
			'per_page' => 10,
			'type'     => 'dummy',
			'subtype'  => array( 'dummy_first_type' ),
		) );
		$response = $controller->get_items( $request );
		$this->assertEqualSets( range( 1, 5 ), wp_list_pluck( $response->get_data(), 'id' ) );
	}

	/**
	 * Test preparing an item directly with a custom search handler.
	 */
	public function test_custom_search_handler_prepare_item() {
		$controller = new WP_REST_Search_Controller( array( new WP_REST_Dummy_Search_Handler( 10 ) ) );

		$request  = $this->get_request( array(
			'type'    => 'dummy',
			'subtype' => array( WP_REST_Search_Controller::TYPE_ANY ),
		) );
		$response = $controller->prepare_item_for_response( 1, $request );
		$data     = $response->get_data();
		$this->assertEquals( array(
			'id',
			'title',
			'url',
			'type',
			'subtype',
		), array_keys( $data ) );
	}

	/**
	 * Test preparing an item directly with a custom search handler with limited fields.
	 */
	public function test_custom_search_handler_prepare_item_limit_fields() {
		if ( ! method_exists( 'WP_REST_Controller', 'get_fields_for_response' ) ) {
			$this->markTestSkipped( 'Limiting fields requires the WP_REST_Controller::get_fields_for_response() method.' );
		}

		$controller = new WP_REST_Search_Controller( array( new WP_REST_Dummy_Search_Handler( 10 ) ) );

		$request  = $this->get_request( array(
			'type'    => 'dummy',
			'subtype' => array( WP_REST_Search_Controller::TYPE_ANY ),
			'_fields' => 'id,title',
		) );
		$response = $controller->prepare_item_for_response( 1, $request );
		$data     = $response->get_data();
		$this->assertEquals( array(
			'id',
			'title',
		), array_keys( $data ) );
	}

	/**
	 * Test getting the collection params directly with a custom search handler.
	 */
	public function test_custom_search_handler_get_collection_params() {
		$controller = new WP_REST_Search_Controller( array( new WP_REST_Dummy_Search_Handler( 10 ) ) );

		$params = $controller->get_collection_params();
		$this->assertEquals( 'dummy', $params[ WP_REST_Search_Controller::PROP_TYPE ]['default'] );
		$this->assertEqualSets( array( 'dummy' ), $params[ WP_REST_Search_Controller::PROP_TYPE ]['enum'] );
		$this->assertEqualSets( array( 'dummy_first_type', 'dummy_second_type', WP_REST_Search_Controller::TYPE_ANY ), $params[ WP_REST_Search_Controller::PROP_SUBTYPE ]['items']['enum'] );
	}

	/**
	 * Perform a REST request to our search endpoint with given parameters.
	 */
	private function do_request_with_params( $params = array(), $method = 'GET' ) {
		$request = $this->get_request( $params, $method );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Get a REST request object for given parameters.
	 */
	private function get_request( $params = array(), $method = 'GET' ) {
		$request = new WP_REST_Request( $method, '/gutenberg/v1/search' );

		foreach ( $params as $param => $value ) {
			$request->set_param( $param, $value );
		}

		return $request;
	}
}
