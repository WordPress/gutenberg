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
	 * Attachments with title 'my-footitle'.
	 *
	 * @var array
	 */
	private static $my_title_attachment_ids = array();

	/**
	 * Posts with content 'my-foocontent'.
	 *
	 * @var array
	 */
	private static $my_content_post_ids = array();

	/**
	 * Author user ID.
	 *
	 * @var int
	 */
	private static $author_id;

	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	private static $editor_id;

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

		self::$my_title_attachment_ids = $factory->attachment->create_many( 4, array(
			'post_title' => 'my-footitle',
			'post_type'  => 'attachment',
		) );

		self::$my_content_post_ids = $factory->post->create_many( 6, array(
			'post_content' => 'my-foocontent',
		) );

		self::$author_id = $factory->user->create( array(
			'role' => 'author',
		) );

		self::$editor_id = $factory->user->create( array(
			'role' => 'editor',
		) );
	}

	/**
	 * Delete our fake data after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		$post_ids = array_merge(
			self::$my_title_post_ids,
			self::$my_title_page_ids,
			self::$my_title_attachment_ids,
			self::$my_content_post_ids
		);

		foreach ( $post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}

		self::delete_user( self::$author_id );
		self::delete_user( self::$editor_id );
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
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
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
				self::$my_title_attachment_ids,
				self::$my_content_post_ids
			),
			wp_list_pluck( $response->get_data(), 'id' )
		);
	}

	/**
	 * Search through our posts.
	 */
	public function test_get_items_search_posts() {
		$response = $this->do_request_with_params( array(
			'per_page' => 100,
			'type'     => 'post',
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
	 * Search through our posts and pages.
	 */
	public function test_get_items_search_posts_and_pages() {
		$response = $this->do_request_with_params( array(
			'per_page' => 100,
			'type'     => 'post,page',
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
	 * Search through all content but attachments.
	 */
	public function test_get_items_search_exclude_attachments() {
		$response = $this->do_request_with_params( array(
			'per_page'     => 100,
			'type_exclude' => 'attachment',
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
	 * Search through all content with slug 'my-footitle'.
	 */
	public function test_get_items_search_by_slug() {
		$response = $this->do_request_with_params( array(
			'slug' => 'my-footitle',
		) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEqualSets(
			array(
				self::$my_title_post_ids[0],
				self::$my_title_page_ids[0],
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
				self::$my_title_page_ids,
				self::$my_title_attachment_ids
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
		wp_set_current_user( self::$editor_id );

		$response = $this->do_request_with_params();
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( array(
			'id',
			'date',
			'date_gmt',
			'guid',
			'modified',
			'modified_gmt',
			'slug',
			'status',
			'type',
			'link',
			'title',
			'content',
			'excerpt',
			'author',
			'_links',
		), array_keys( $data[0] ) );
	}

	/**
	 * Test preparing the data with limited fields contains the correct fields.
	 */
	public function test_prepare_item_limit_fields() {
		wp_set_current_user( self::$editor_id );

		$response = $this->do_request_with_params( array(
			'_fields' => 'id,title,type,link'
		) );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( array(
			'id',
			'type',
			'link',
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

		$this->assertArrayHasKey( 'author', $properties );
		$this->assertArrayHasKey( 'content', $properties );
		$this->assertArrayHasKey( 'date', $properties );
		$this->assertArrayHasKey( 'date_gmt', $properties );
		$this->assertArrayHasKey( 'excerpt', $properties );
		$this->assertArrayHasKey( 'guid', $properties );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'link', $properties );
		$this->assertArrayHasKey( 'modified', $properties );
		$this->assertArrayHasKey( 'modified_gmt', $properties );
		$this->assertArrayHasKey( 'slug', $properties );
		$this->assertArrayHasKey( 'status', $properties );
		$this->assertArrayHasKey( 'title', $properties );
		$this->assertArrayHasKey( 'type', $properties );
	}

	/**
	 * Tests that non-public post types are not allowed.
	 */
	public function test_non_public_type() {
		$response = $this->do_request_with_params( array(
			'type' => 'post,nav_menu_item',
		) );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 * Tests that post type capabilities are considered in edit context for author.
	 */
	public function test_prohibited_type_in_edit_context() {
		wp_set_current_user( self::$author_id );

		$response = $this->do_request_with_params( array(
			'context' => 'edit',
			'type'    => 'page',
		) );
		$this->assertErrorResponse( 'rest_forbidden_context', $response, 403 );
	}

	/**
	 * Tests that post type capabilities are considered in edit context for editor.
	 */
	public function test_allowed_type_in_edit_context() {
		wp_set_current_user( self::$editor_id );

		$response = $this->do_request_with_params( array(
			'context' => 'edit',
			'type'    => 'page',
		) );
		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * Perform a REST request to our search endpoint with given parameters.
	 */
	private function do_request_with_params( $params = array(), $method = 'GET' ) {
		$request  = new WP_REST_Request( $method, '/gutenberg/v1/search' );

		foreach ( $params as $param => $value ) {
			$request->set_param( $param, $value );
		}

		return rest_get_server()->dispatch( $request );
	}
}
