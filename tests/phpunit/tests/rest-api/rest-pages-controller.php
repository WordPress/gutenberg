<?php
/**
 * Unit tests covering WP_REST_Posts_Controller functionality, used for
 * Pages
 *
 * @package WordPress
 * @subpackage REST API
 */

 /**
  * @group restapi
  */
class WP_Test_REST_Pages_Controller extends WP_Test_REST_Post_Type_Controller_Testcase {
	protected static $editor_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$editor_id = $factory->user->create( array(
			'role' => 'editor',
		) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
	}

	public function setUp() {
		parent::setUp();
		$this->has_setup_template = false;
		add_filter( 'theme_page_templates', array( $this, 'filter_theme_page_templates' ) );
	}

	public function test_register_routes() {

	}

	public function test_context_param() {
		// Collection
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/pages' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
		// Single
		$page_id = $this->factory->post->create( array( 'post_type' => 'page' ) );
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/pages/' . $page_id );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	public function test_registered_query_params() {
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/pages' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$keys = array_keys( $data['endpoints'][0]['args'] );
		sort( $keys );
		$this->assertEquals( array(
			'after',
			'author',
			'author_exclude',
			'before',
			'context',
			'exclude',
			'include',
			'menu_order',
			'offset',
			'order',
			'orderby',
			'page',
			'parent',
			'parent_exclude',
			'per_page',
			'search',
			'slug',
			'status',
			), $keys );
	}

	public function test_get_items() {

	}

	public function test_get_items_parent_query() {
		$id1 = $this->factory->post->create( array( 'post_status' => 'publish', 'post_type' => 'page' ) );
		$id2 = $this->factory->post->create( array( 'post_status' => 'publish', 'post_type' => 'page', 'post_parent' => $id1 ) );
		// No parent
		$request = new WP_REST_Request( 'GET', '/wp/v2/pages' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 2, count( $data ) );
		// Filter to parent
		$request->set_param( 'parent', $id1 );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 1, count( $data ) );
		$this->assertEquals( $id2, $data[0]['id'] );
	}

	public function test_get_items_parents_query() {
		$id1 = $this->factory->post->create( array( 'post_status' => 'publish', 'post_type' => 'page' ) );
		$id2 = $this->factory->post->create( array( 'post_status' => 'publish', 'post_type' => 'page', 'post_parent' => $id1 ) );
		$id3 = $this->factory->post->create( array( 'post_status' => 'publish', 'post_type' => 'page' ) );
		$id4 = $this->factory->post->create( array( 'post_status' => 'publish', 'post_type' => 'page', 'post_parent' => $id3 ) );
		// No parent
		$request = new WP_REST_Request( 'GET', '/wp/v2/pages' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 4, count( $data ) );
		// Filter to parents
		$request->set_param( 'parent', array( $id1, $id3 ) );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 2, count( $data ) );
		$this->assertEqualSets( array( $id2, $id4 ), wp_list_pluck( $data, 'id' ) );
	}

	public function test_get_items_parent_exclude_query() {
		$id1 = $this->factory->post->create( array( 'post_status' => 'publish', 'post_type' => 'page' ) );
		$this->factory->post->create( array( 'post_status' => 'publish', 'post_type' => 'page', 'post_parent' => $id1 ) );
		// No parent
		$request = new WP_REST_Request( 'GET', '/wp/v2/pages' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 2, count( $data ) );
		// Filter to parent
		$request->set_param( 'parent_exclude', $id1 );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 1, count( $data ) );
		$this->assertEquals( $id1, $data[0]['id'] );
	}

	public function test_get_items_menu_order_query() {
		$id1 = $this->factory->post->create( array( 'post_status' => 'publish', 'post_type' => 'page' ) );
		$id2 = $this->factory->post->create( array( 'post_status' => 'publish', 'post_type' => 'page', 'menu_order' => 2 ) );
		$id3 = $this->factory->post->create( array( 'post_status' => 'publish', 'post_type' => 'page', 'menu_order' => 3 ) );
		$id4 = $this->factory->post->create( array( 'post_status' => 'publish', 'post_type' => 'page', 'menu_order' => 1 ) );
		// No parent
		$request = new WP_REST_Request( 'GET', '/wp/v2/pages' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEqualSets( array( $id1, $id2, $id3, $id4 ), wp_list_pluck( $data, 'id' ) );
		// Filter to menu_order
		$request->set_param( 'menu_order', 1 );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEqualSets( array( $id4 ), wp_list_pluck( $data, 'id' ) );
		// Order by menu order
		$request = new WP_REST_Request( 'GET', '/wp/v2/pages' );
		$request->set_param( 'order', 'asc' );
		$request->set_param( 'orderby', 'menu_order' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( $id1, $data[0]['id'] );
		$this->assertEquals( $id4, $data[1]['id'] );
		$this->assertEquals( $id2, $data[2]['id'] );
		$this->assertEquals( $id3, $data[3]['id'] );
	}

	public function test_get_items_min_max_pages_query() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/pages' );
		$request->set_param( 'per_page', 0 );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$data = $response->get_data();
		// Safe format for 4.4 and 4.5 https://core.trac.wordpress.org/ticket/35028
		$first_error = array_shift( $data['data']['params'] );
		$this->assertContains( 'per_page must be between 1 (inclusive) and 100 (inclusive)', $first_error );
		$request->set_param( 'per_page', 101 );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$data = $response->get_data();
		$first_error = array_shift( $data['data']['params'] );
		$this->assertContains( 'per_page must be between 1 (inclusive) and 100 (inclusive)', $first_error );
	}

	public function test_get_items_private_filter_query_var() {
		// Private query vars inaccessible to unauthorized users
		wp_set_current_user( 0 );
		$page_id = $this->factory->post->create( array( 'post_status' => 'publish', 'post_type' => 'page' ) );
		$draft_id = $this->factory->post->create( array( 'post_status' => 'draft', 'post_type' => 'page' ) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/pages' );
		$request->set_param( 'status', 'draft' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );

		// But they are accessible to authorized users
		wp_set_current_user( self::$editor_id );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertCount( 1, $data );
		$this->assertEquals( $draft_id, $data[0]['id'] );
	}

	public function test_get_items_invalid_date() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/pages' );
		$request->set_param( 'after', rand_str() );
		$request->set_param( 'before', rand_str() );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_get_items_valid_date() {
		$post1 = $this->factory->post->create( array( 'post_date' => '2016-01-15T00:00:00Z', 'post_type' => 'page' ) );
		$post2 = $this->factory->post->create( array( 'post_date' => '2016-01-16T00:00:00Z', 'post_type' => 'page' ) );
		$post3 = $this->factory->post->create( array( 'post_date' => '2016-01-17T00:00:00Z', 'post_type' => 'page' ) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/pages' );
		$request->set_param( 'after', '2016-01-15T00:00:00Z' );
		$request->set_param( 'before', '2016-01-17T00:00:00Z' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertCount( 1, $data );
		$this->assertEquals( $post2, $data[0]['id'] );
	}

	public function test_get_item() {

	}

	public function test_get_item_invalid_post_type() {
		$post_id = $this->factory->post->create();
		$request = new WP_REST_Request( 'GET', '/wp/v2/pages/' . $post_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 404, $response->get_status() );
	}

	public function test_create_item() {

	}

	public function test_create_item_with_template() {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/pages' );
		$params = $this->set_post_data( array(
			'template'       => 'page-my-test-template.php',
		) );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );

		$data = $response->get_data();
		$new_post = get_post( $data['id'] );
		$this->assertEquals( 'page-my-test-template.php', $data['template'] );
		$this->assertEquals( 'page-my-test-template.php', get_page_template_slug( $new_post->ID ) );
	}

	public function test_create_page_with_parent() {
		$page_id = $this->factory->post->create( array(
			'type' => 'page',
		) );
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/pages' );
		$params = $this->set_post_data( array(
			'parent' => $page_id,
		) );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 201, $response->get_status() );

		$links = $response->get_links();
		$this->assertArrayHasKey( 'up', $links );

		$data = $response->get_data();
		$new_post = get_post( $data['id'] );
		$this->assertEquals( $page_id, $data['parent'] );
		$this->assertEquals( $page_id, $new_post->post_parent );
	}

	public function test_create_page_with_invalid_parent() {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/pages' );
		$params = $this->set_post_data( array(
			'parent' => -1,
		) );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_post_invalid_id', $response, 400 );
	}

	public function test_update_item() {

	}

	public function test_delete_item() {

	}

	public function test_prepare_item() {

	}

	public function test_get_pages_params() {
		$this->factory->post->create_many( 8, array(
			'post_type' => 'page',
		) );

		$request = new WP_REST_Request( 'GET', '/wp/v2/pages' );
		$request->set_query_params( array(
			'page'           => 2,
			'per_page'       => 4,
		) );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		$headers = $response->get_headers();
		$this->assertEquals( 8, $headers['X-WP-Total'] );
		$this->assertEquals( 2, $headers['X-WP-TotalPages'] );

		$all_data = $response->get_data();
		$this->assertEquals( 4, count( $all_data ) );
		foreach ( $all_data as $post ) {
			$this->assertEquals( 'page', $post['type'] );
		}
	}

	public function test_update_page_menu_order() {

		$page_id = $this->factory->post->create( array(
			'post_type' => 'page',
		) );

		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/pages/%d', $page_id ) );

		$request->set_body_params( array(
			'menu_order' => 1,
		) );
		$response = $this->server->dispatch( $request );

		$new_data = $response->get_data();
		$this->assertEquals( 1, $new_data['menu_order'] );
	}

	public function test_update_page_menu_order_to_zero() {

		$page_id = $this->factory->post->create( array(
			'post_type'  => 'page',
			'menu_order' => 1,
		) );

		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/pages/%d', $page_id ) );

		$request->set_body_params(array(
			'menu_order' => 0,
		));
		$response = $this->server->dispatch( $request );

		$new_data = $response->get_data();
		$this->assertEquals( 0, $new_data['menu_order'] );
	}

	public function test_get_item_schema() {
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/pages' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertEquals( 21, count( $properties ) );
		$this->assertArrayHasKey( 'author', $properties );
		$this->assertArrayHasKey( 'comment_status', $properties );
		$this->assertArrayHasKey( 'content', $properties );
		$this->assertArrayHasKey( 'date', $properties );
		$this->assertArrayHasKey( 'date_gmt', $properties );
		$this->assertArrayHasKey( 'guid', $properties );
		$this->assertArrayHasKey( 'excerpt', $properties );
		$this->assertArrayHasKey( 'featured_media', $properties );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'link', $properties );
		$this->assertArrayHasKey( 'menu_order', $properties );
		$this->assertArrayHasKey( 'meta', $properties );
		$this->assertArrayHasKey( 'modified', $properties );
		$this->assertArrayHasKey( 'modified_gmt', $properties );
		$this->assertArrayHasKey( 'parent', $properties );
		$this->assertArrayHasKey( 'ping_status', $properties );
		$this->assertArrayHasKey( 'slug', $properties );
		$this->assertArrayHasKey( 'status', $properties );
		$this->assertArrayHasKey( 'template', $properties );
		$this->assertArrayHasKey( 'title', $properties );
		$this->assertArrayHasKey( 'type', $properties );
	}

	public function tearDown() {
		parent::tearDown();
		remove_filter( 'theme_page_templates', array( $this, 'filter_theme_page_templates' ) );
	}

	public function filter_theme_page_templates( $page_templates ) {
		return array(
			'page-my-test-template.php' => 'My Test Template',
		);
		return $page_templates;
	}

	protected function set_post_data( $args = array() ) {
		$args = parent::set_post_data( $args );
		$args['type'] = 'page';
		return $args;
	}

}
