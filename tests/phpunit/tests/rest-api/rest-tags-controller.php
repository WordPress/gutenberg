<?php
/**
 * Unit tests covering WP_REST_Terms_Controller functionality, used for Tags.
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi
 */
class WP_Test_REST_Tags_Controller extends WP_Test_REST_Controller_Testcase {
	protected static $superadmin;
	protected static $administrator;
	protected static $editor;
	protected static $subscriber;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$superadmin = $factory->user->create( array(
			'role'       => 'administrator',
			'user_login' => 'superadmin',
		) );
		self::$administrator = $factory->user->create( array(
			'role' => 'administrator',
		) );
		self::$editor = $factory->user->create( array(
			'role' => 'editor',
		) );
		self::$subscriber = $factory->user->create( array(
			'role' => 'subscriber',
		) );
		if ( is_multisite() ) {
			update_site_option( 'site_admins', array( 'superadmin' ) );
		}
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$administrator );
		self::delete_user( self::$subscriber );
	}

	public function test_register_routes() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/wp/v2/tags', $routes );
		$this->assertArrayHasKey( '/wp/v2/tags/(?P<id>[\d]+)', $routes );
	}

	public function test_context_param() {
		// Collection
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/tags' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEqualSets( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
		// Single
		$tag1 = $this->factory->tag->create( array( 'name' => 'Season 5' ) );
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/tags/' . $tag1 );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEqualSets( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	public function test_registered_query_params() {
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/tags' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$keys = array_keys( $data['endpoints'][0]['args'] );
		sort( $keys );
		$this->assertEquals( array(
			'context',
			'exclude',
			'hide_empty',
			'include',
			'offset',
			'order',
			'orderby',
			'page',
			'per_page',
			'post',
			'search',
			'slug',
			), $keys );
	}

	public function test_get_items() {
		$this->factory->tag->create();
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$response = $this->server->dispatch( $request );
		$this->check_get_taxonomy_terms_response( $response );
	}

	public function test_get_items_invalid_permission_for_context() {
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_forbidden_context', $response, 401 );
	}

	public function test_get_items_hide_empty_arg() {
		$post_id = $this->factory->post->create();
		$tag1 = $this->factory->tag->create( array( 'name' => 'Season 5' ) );
		$tag2 = $this->factory->tag->create( array( 'name' => 'The Be Sharps' ) );
		wp_set_object_terms( $post_id, array( $tag1, $tag2 ), 'post_tag' );
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'hide_empty', true );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 2, count( $data ) );
		$this->assertEquals( 'Season 5', $data[0]['name'] );
		$this->assertEquals( 'The Be Sharps', $data[1]['name'] );
		// invalid value should fail
		$request->set_param( 'hide_empty', 'nothanks' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_get_items_include_query() {
		$id1 = $this->factory->tag->create();
		$id2 = $this->factory->tag->create();
		$id3 = $this->factory->tag->create();
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		// Orderby=>asc
		$request->set_param( 'include', array( $id3, $id1 ) );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 2, count( $data ) );
		$this->assertEquals( $id1, $data[0]['id'] );
		// Orderby=>include
		$request->set_param( 'orderby', 'include' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 2, count( $data ) );
		$this->assertEquals( $id3, $data[0]['id'] );
		// Include invalid value shoud fail
		$request->set_param( 'include', array( 'myterm' ) );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_get_items_exclude_query() {
		$id1 = $this->factory->tag->create();
		$id2 = $this->factory->tag->create();
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertTrue( in_array( $id1, wp_list_pluck( $data, 'id' ), true ) );
		$this->assertTrue( in_array( $id2, wp_list_pluck( $data, 'id' ), true ) );
		$request->set_param( 'exclude', array( $id2 ) );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertTrue( in_array( $id1, wp_list_pluck( $data, 'id' ), true ) );
		$this->assertFalse( in_array( $id2, wp_list_pluck( $data, 'id' ), true ) );
		// Invalid exclude value should fail
		$request->set_param( 'exclude', array( 'invalid' ) );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_get_items_offset_query() {
		$id1 = $this->factory->tag->create();
		$id2 = $this->factory->tag->create();
		$id3 = $this->factory->tag->create();
		$id4 = $this->factory->tag->create();
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'offset', 1 );
		$response = $this->server->dispatch( $request );
		$this->assertCount( 3, $response->get_data() );
		// 'offset' works with 'per_page'
		$request->set_param( 'per_page', 2 );
		$response = $this->server->dispatch( $request );
		$this->assertCount( 2, $response->get_data() );
		// 'offset' takes priority over 'page'
		$request->set_param( 'page', 3 );
		$response = $this->server->dispatch( $request );
		$this->assertCount( 2, $response->get_data() );
		// 'offset' invalid value shoudl fail
		$request->set_param( 'offset', 'moreplease' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}


	public function test_get_items_orderby_args() {
		$tag1 = $this->factory->tag->create( array( 'name' => 'Apple' ) );
		$tag2 = $this->factory->tag->create( array( 'name' => 'Banana' ) );
		/*
		 * Tests:
		 * - orderby
		 * - order
		 * - per_page
		 */
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'orderby', 'name' );
		$request->set_param( 'order', 'desc' );
		$request->set_param( 'per_page', 1 );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 1, count( $data ) );
		$this->assertEquals( 'Banana', $data[0]['name'] );
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'orderby', 'name' );
		$request->set_param( 'order', 'asc' );
		$request->set_param( 'per_page', 2 );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 2, count( $data ) );
		$this->assertEquals( 'Apple', $data[0]['name'] );
		// Invalid orderby should fail.
		$request->set_param( 'orderby', 'invalid' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_get_items_orderby_id() {
		$tag0 = $this->factory->tag->create( array( 'name' => 'Cantaloupe' ) );
		$tag1 = $this->factory->tag->create( array( 'name' => 'Apple' ) );
		$tag2 = $this->factory->tag->create( array( 'name' => 'Banana' ) );
		// defaults to orderby=name, order=asc
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'Apple', $data[0]['name'] );
		$this->assertEquals( 'Banana', $data[1]['name'] );
		$this->assertEquals( 'Cantaloupe', $data[2]['name'] );
		// orderby=id, with default order=asc
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'orderby', 'id' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'Cantaloupe', $data[0]['name'] );
		$this->assertEquals( 'Apple', $data[1]['name'] );
		$this->assertEquals( 'Banana', $data[2]['name'] );
		// orderby=id, order=desc
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'orderby', 'id' );
		$request->set_param( 'order', 'desc' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'Banana', $data[0]['name'] );
		$this->assertEquals( 'Apple', $data[1]['name'] );
		$this->assertEquals( 'Cantaloupe', $data[2]['name'] );
	}

	public function test_get_items_post_args() {
		$post_id = $this->factory->post->create();
		$tag1 = $this->factory->tag->create( array( 'name' => 'DC' ) );
		$tag2 = $this->factory->tag->create( array( 'name' => 'Marvel' ) );
		$this->factory->tag->create( array( 'name' => 'Dark Horse' ) );
		wp_set_object_terms( $post_id, array( $tag1, $tag2 ), 'post_tag' );

		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'post', $post_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( 2, count( $data ) );
		$this->assertEquals( 'DC', $data[0]['name'] );

		// Invalid post should error.
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'post', 'invalid-post' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_get_terms_post_args_paging() {
		$post_id = $this->factory->post->create();
		$tag_ids = array();

		for ( $i = 0; $i < 30; $i++ ) {
			$tag_ids[] = $this->factory->tag->create( array(
				'name'   => "Tag {$i}",
			) );
		}
		wp_set_object_terms( $post_id, $tag_ids, 'post_tag' );

		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'page', 1 );
		$request->set_param( 'per_page', 15 );
		$request->set_param( 'orderby', 'id' );
		$response = $this->server->dispatch( $request );
		$tags = $response->get_data();

		$i = 0;
		foreach ( $tags as $tag ) {
			$this->assertEquals( $tag['name'], "Tag {$i}" );
			$i++;
		}

		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'page', 2 );
		$request->set_param( 'per_page', 15 );
		$request->set_param( 'orderby', 'id' );
		$response = $this->server->dispatch( $request );
		$tags = $response->get_data();

		foreach ( $tags as $tag ) {
			$this->assertEquals( $tag['name'], "Tag {$i}" );
			$i++;
		}
	}

	public function test_get_items_post_empty() {
		$post_id = $this->factory->post->create();

		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'post', $post_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertCount( 0, $data );
	}

	public function test_get_items_custom_tax_post_args() {
		register_taxonomy( 'batman', 'post', array( 'show_in_rest' => true ) );
		$controller = new WP_REST_Terms_Controller( 'batman' );
		$controller->register_routes();
		$term1 = $this->factory->term->create( array( 'name' => 'Cape', 'taxonomy' => 'batman' ) );
		$term2 = $this->factory->term->create( array( 'name' => 'Mask', 'taxonomy' => 'batman' ) );
		$this->factory->term->create( array( 'name' => 'Car', 'taxonomy' => 'batman' ) );
		$post_id = $this->factory->post->create();
		wp_set_object_terms( $post_id, array( $term1, $term2 ), 'batman' );

		$request = new WP_REST_Request( 'GET', '/wp/v2/batman' );
		$request->set_param( 'post', $post_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( 2, count( $data ) );
		$this->assertEquals( 'Cape', $data[0]['name'] );
	}

	public function test_get_items_search_args() {
		$tag1 = $this->factory->tag->create( array( 'name' => 'Apple' ) );
		$tag2 = $this->factory->tag->create( array( 'name' => 'Banana' ) );
		/*
		 * Tests:
		 * - search
		 */
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'search', 'App' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 1, count( $data ) );
		$this->assertEquals( 'Apple', $data[0]['name'] );
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'search', 'Garbage' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 0, count( $data ) );
	}

	public function test_get_items_slug_arg() {
		$tag1 = $this->factory->tag->create( array( 'name' => 'Apple' ) );
		$tag2 = $this->factory->tag->create( array( 'name' => 'Banana' ) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'slug', 'apple' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 1, count( $data ) );
		$this->assertEquals( 'Apple', $data[0]['name'] );
	}

	public function test_get_terms_private_taxonomy() {
		register_taxonomy( 'robin', 'post', array( 'public' => false ) );
		$term1 = $this->factory->term->create( array( 'name' => 'Cape', 'taxonomy' => 'robin' ) );
		$term2 = $this->factory->term->create( array( 'name' => 'Mask', 'taxonomy' => 'robin' ) );

		$request = new WP_REST_Request( 'GET', '/wp/v2/terms/robin' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_no_route', $response, 404 );
	}

	public function test_get_terms_pagination_headers() {
		// Start of the index
		for ( $i = 0; $i < 50; $i++ ) {
			$this->factory->tag->create( array(
				'name'   => "Tag {$i}",
				) );
		}
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$response = $this->server->dispatch( $request );
		$headers = $response->get_headers();
		$this->assertEquals( 50, $headers['X-WP-Total'] );
		$this->assertEquals( 5, $headers['X-WP-TotalPages'] );
		$next_link = add_query_arg( array(
			'page'    => 2,
			), rest_url( 'wp/v2/tags' ) );
		$this->assertFalse( stripos( $headers['Link'], 'rel="prev"' ) );
		$this->assertContains( '<' . $next_link . '>; rel="next"', $headers['Link'] );
		// 3rd page
		$this->factory->tag->create( array(
				'name'   => 'Tag 51',
				) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'page', 3 );
		$response = $this->server->dispatch( $request );
		$headers = $response->get_headers();
		$this->assertEquals( 51, $headers['X-WP-Total'] );
		$this->assertEquals( 6, $headers['X-WP-TotalPages'] );
		$prev_link = add_query_arg( array(
			'page'    => 2,
			), rest_url( 'wp/v2/tags' ) );
		$this->assertContains( '<' . $prev_link . '>; rel="prev"', $headers['Link'] );
		$next_link = add_query_arg( array(
			'page'    => 4,
			), rest_url( 'wp/v2/tags' ) );
		$this->assertContains( '<' . $next_link . '>; rel="next"', $headers['Link'] );
		// Last page
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'page', 6 );
		$response = $this->server->dispatch( $request );
		$headers = $response->get_headers();
		$this->assertEquals( 51, $headers['X-WP-Total'] );
		$this->assertEquals( 6, $headers['X-WP-TotalPages'] );
		$prev_link = add_query_arg( array(
			'page'    => 5,
			), rest_url( 'wp/v2/tags' ) );
		$this->assertContains( '<' . $prev_link . '>; rel="prev"', $headers['Link'] );
		$this->assertFalse( stripos( $headers['Link'], 'rel="next"' ) );
		// Out of bounds
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'page', 8 );
		$response = $this->server->dispatch( $request );
		$headers = $response->get_headers();
		$this->assertEquals( 51, $headers['X-WP-Total'] );
		$this->assertEquals( 6, $headers['X-WP-TotalPages'] );
		$prev_link = add_query_arg( array(
			'page'    => 6,
			), rest_url( 'wp/v2/tags' ) );
		$this->assertContains( '<' . $prev_link . '>; rel="prev"', $headers['Link'] );
		$this->assertFalse( stripos( $headers['Link'], 'rel="next"' ) );
	}

	public function test_get_items_invalid_context() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'context', 'banana' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_get_item() {
		$id = $this->factory->tag->create();
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags/' . $id );
		$response = $this->server->dispatch( $request );
		$this->check_get_taxonomy_term_response( $response, $id );
	}

	public function test_get_term_invalid_term() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_term_invalid', $response, 404 );
	}

	public function test_get_item_invalid_permission_for_context() {
		$id = $this->factory->tag->create();
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags/' . $id );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_forbidden_context', $response, 401 );
	}

	public function test_get_term_private_taxonomy() {
		register_taxonomy( 'robin', 'post', array( 'public' => false ) );
		$term1 = $this->factory->term->create( array( 'name' => 'Cape', 'taxonomy' => 'robin' ) );

		$request = new WP_REST_Request( 'GET', '/wp/v2/terms/robin/' . $term1 );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_no_route', $response, 404 );
	}

	public function test_get_item_incorrect_taxonomy() {
		register_taxonomy( 'robin', 'post' );
		$term1 = $this->factory->term->create( array( 'name' => 'Cape', 'taxonomy' => 'robin' ) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags/' . $term1 );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_term_invalid', $response, 404 );
	}

	public function test_create_item() {
		wp_set_current_user( self::$administrator );
		$request = new WP_REST_Request( 'POST', '/wp/v2/tags' );
		$request->set_param( 'name', 'My Awesome Term' );
		$request->set_param( 'description', 'This term is so awesome.' );
		$request->set_param( 'slug', 'so-awesome' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 201, $response->get_status() );
		$headers = $response->get_headers();
		$data = $response->get_data();
		$this->assertContains( '/wp/v2/tags/' . $data['id'], $headers['Location'] );
		$this->assertEquals( 'My Awesome Term', $data['name'] );
		$this->assertEquals( 'This term is so awesome.', $data['description'] );
		$this->assertEquals( 'so-awesome', $data['slug'] );
	}

	public function test_create_item_incorrect_permissions() {
		wp_set_current_user( self::$subscriber );
		$request = new WP_REST_Request( 'POST', '/wp/v2/tags' );
		$request->set_param( 'name', 'Incorrect permissions' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_create', $response, 403 );
	}

	public function test_create_item_missing_arguments() {
		wp_set_current_user( self::$administrator );
		$request = new WP_REST_Request( 'POST', '/wp/v2/tags' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_missing_callback_param', $response, 400 );
	}

	public function test_create_item_parent_non_hierarchical_taxonomy() {
		wp_set_current_user( self::$administrator );

		$request = new WP_REST_Request( 'POST', '/wp/v2/tags' );
		$request->set_param( 'name', 'My Awesome Term' );
		$request->set_param( 'parent', REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_taxonomy_not_hierarchical', $response, 400 );
	}

	public function test_update_item() {
		wp_set_current_user( self::$administrator );
		$orig_args = array(
			'name'        => 'Original Name',
			'description' => 'Original Description',
			'slug'        => 'original-slug',
			);
		$term = get_term_by( 'id', $this->factory->tag->create( $orig_args ), 'post_tag' );
		$request = new WP_REST_Request( 'POST', '/wp/v2/tags/' . $term->term_id );
		$request->set_param( 'name', 'New Name' );
		$request->set_param( 'description', 'New Description' );
		$request->set_param( 'slug', 'new-slug' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'New Name', $data['name'] );
		$this->assertEquals( 'New Description', $data['description'] );
		$this->assertEquals( 'new-slug', $data['slug'] );
	}

	public function test_update_item_no_change() {
		wp_set_current_user( self::$administrator );
		$term = get_term_by( 'id', $this->factory->tag->create(), 'post_tag' );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/tags/' . $term->term_id );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$request->set_param( 'slug', $term->slug );

		// Run twice to make sure that the update still succeeds even if no DB
		// rows are updated.
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_update_item_invalid_term() {
		wp_set_current_user( self::$administrator );
		$request = new WP_REST_Request( 'POST', '/wp/v2/tags/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$request->set_param( 'name', 'Invalid Term' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_term_invalid', $response, 404 );
	}

	public function test_update_item_incorrect_permissions() {
		wp_set_current_user( self::$subscriber );
		$term = get_term_by( 'id', $this->factory->tag->create(), 'post_tag' );
		$request = new WP_REST_Request( 'POST', '/wp/v2/tags/' . $term->term_id );
		$request->set_param( 'name', 'Incorrect permissions' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_update', $response, 403 );
	}

	/**
	 * @ticket 38505
	 */
	public function test_update_item_with_edit_term_cap_granted() {
		wp_set_current_user( self::$subscriber );
		$term = $this->factory->tag->create_and_get();
		$request = new WP_REST_Request( 'POST', '/wp/v2/tags/' . $term->term_id );
		$request->set_param( 'name', 'New Name' );

		add_filter( 'map_meta_cap', array( $this, 'grant_edit_term' ), 10, 2 );
		$response = $this->server->dispatch( $request );
		remove_filter( 'user_has_cap', array( $this, 'grant_edit_term' ), 10, 2 );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'New Name', $data['name'] );
	}

	public function grant_edit_term( $caps, $cap ) {
		if ( 'edit_term' === $cap ) {
			$caps = array( 'read' );
		}
		return $caps;
	}

	/**
	 * @ticket 38505
	 */
	public function test_update_item_with_edit_term_cap_revoked() {
		wp_set_current_user( self::$administrator );
		$term = $this->factory->tag->create_and_get();
		$request = new WP_REST_Request( 'POST', '/wp/v2/tags/' . $term->term_id );
		$request->set_param( 'name', 'New Name' );

		add_filter( 'map_meta_cap', array( $this, 'revoke_edit_term' ), 10, 2 );
		$response = $this->server->dispatch( $request );
		remove_filter( 'user_has_cap', array( $this, 'revoke_edit_term' ), 10, 2 );

		$this->assertErrorResponse( 'rest_cannot_update', $response, 403 );
	}

	public function revoke_edit_term( $caps, $cap ) {
		if ( 'edit_term' === $cap ) {
			$caps = array( 'do_not_allow' );
		}
		return $caps;
	}

	public function test_update_item_parent_non_hierarchical_taxonomy() {
		wp_set_current_user( self::$administrator );
		$term = get_term_by( 'id', $this->factory->tag->create(), 'post_tag' );

		$request = new WP_REST_Request( 'POST', '/wp/v2/tags/' . $term->term_id );
		$request->set_param( 'parent', REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_taxonomy_not_hierarchical', $response, 400 );
	}

	public function verify_tag_roundtrip( $input = array(), $expected_output = array() ) {
		// Create the tag
		$request = new WP_REST_Request( 'POST', '/wp/v2/tags' );
		foreach ( $input as $name => $value ) {
			$request->set_param( $name, $value );
		}
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 201, $response->get_status() );
		$actual_output = $response->get_data();

		// Compare expected API output to actual API output
		$this->assertEquals( $expected_output['name'], $actual_output['name'] );
		$this->assertEquals( $expected_output['description'], $actual_output['description'] );

		// Compare expected API output to WP internal values
		$tag = get_term_by( 'id', $actual_output['id'], 'post_tag' );
		$this->assertEquals( $expected_output['name'], $tag->name );
		$this->assertEquals( $expected_output['description'], $tag->description );

		// Update the tag
		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/tags/%d', $actual_output['id'] ) );
		foreach ( $input as $name => $value ) {
			$request->set_param( $name, $value );
		}
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$actual_output = $response->get_data();

		// Compare expected API output to actual API output
		$this->assertEquals( $expected_output['name'], $actual_output['name'] );
		$this->assertEquals( $expected_output['description'], $actual_output['description'] );

		// Compare expected API output to WP internal values
		$tag = get_term_by( 'id', $actual_output['id'], 'post_tag' );
		$this->assertEquals( $expected_output['name'], $tag->name );
		$this->assertEquals( $expected_output['description'], $tag->description );
	}

	public function test_tag_roundtrip_as_editor() {
		wp_set_current_user( self::$editor );
		$this->assertEquals( ! is_multisite(), current_user_can( 'unfiltered_html' ) );
		$this->verify_tag_roundtrip( array(
			'name'        => '\o/ ¯\_(ツ)_/¯',
			'description' => '\o/ ¯\_(ツ)_/¯',
		), array(
			'name'        => '\o/ ¯\_(ツ)_/¯',
			'description' => '\o/ ¯\_(ツ)_/¯',
		) );
	}

	public function test_tag_roundtrip_as_editor_html() {
		wp_set_current_user( self::$editor );
		if ( is_multisite() ) {
			$this->assertFalse( current_user_can( 'unfiltered_html' ) );
			$this->verify_tag_roundtrip( array(
				'name'        => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'description' => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			), array(
				'name'        => 'div strong',
				'description' => 'div <strong>strong</strong> oh noes',
			) );
		} else {
			$this->assertTrue( current_user_can( 'unfiltered_html' ) );
			$this->verify_tag_roundtrip( array(
				'name'        => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'description' => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			), array(
				'name'        => 'div strong',
				'description' => 'div <strong>strong</strong> oh noes',
			) );
		}
	}

	public function test_tag_roundtrip_as_superadmin() {
		wp_set_current_user( self::$superadmin );
		$this->assertTrue( current_user_can( 'unfiltered_html' ) );
		$this->verify_tag_roundtrip( array(
			'name'        => '\\\&\\\ &amp; &invalid; < &lt; &amp;lt;',
			'description' => '\\\&\\\ &amp; &invalid; < &lt; &amp;lt;',
		), array(
			'name'        => '\\\&amp;\\\ &amp; &amp;invalid; &lt; &lt; &amp;lt;',
			'description' => '\\\&amp;\\\ &amp; &amp;invalid; &lt; &lt; &amp;lt;',
		) );
	}

	public function test_tag_roundtrip_as_superadmin_html() {
		wp_set_current_user( self::$superadmin );
		$this->assertTrue( current_user_can( 'unfiltered_html' ) );
		$this->verify_tag_roundtrip( array(
			'name'        => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			'description' => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
		), array(
			'name'        => 'div strong',
			'description' => 'div <strong>strong</strong> oh noes',
		) );
	}

	public function test_delete_item() {
		wp_set_current_user( self::$administrator );
		$term = get_term_by( 'id', $this->factory->tag->create( array( 'name' => 'Deleted Tag' ) ), 'post_tag' );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/tags/' . $term->term_id );
		$request->set_param( 'force', true );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertTrue( $data['deleted'] );
		$this->assertEquals( 'Deleted Tag', $data['previous']['name'] );
	}

	public function test_delete_item_no_trash() {
		wp_set_current_user( self::$administrator );
		$term = get_term_by( 'id', $this->factory->tag->create( array( 'name' => 'Deleted Tag' ) ), 'post_tag' );

		$request = new WP_REST_Request( 'DELETE', '/wp/v2/tags/' . $term->term_id );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_trash_not_supported', $response, 501 );

		$request->set_param( 'force', 'false' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_trash_not_supported', $response, 501 );
	}

	public function test_delete_item_invalid_term() {
		wp_set_current_user( self::$administrator );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/tags/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_term_invalid', $response, 404 );
	}

	public function test_delete_item_incorrect_permissions() {
		wp_set_current_user( self::$subscriber );
		$term = get_term_by( 'id', $this->factory->tag->create(), 'post_tag' );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/tags/' . $term->term_id );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_delete', $response, 403 );
	}

	/**
	 * @ticket 38505
	 */
	public function test_delete_item_with_delete_term_cap_granted() {
		wp_set_current_user( self::$subscriber );
		$term = get_term_by( 'id', $this->factory->tag->create( array( 'name' => 'Deleted Tag' ) ), 'post_tag' );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/tags/' . $term->term_id );
		$request->set_param( 'force', true );

		add_filter( 'map_meta_cap', array( $this, 'grant_delete_term' ), 10, 2 );
		$response = $this->server->dispatch( $request );
		remove_filter( 'map_meta_cap', array( $this, 'grant_delete_term' ), 10, 2 );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertTrue( $data['deleted'] );
		$this->assertEquals( 'Deleted Tag', $data['previous']['name'] );
	}

	public function grant_delete_term( $caps, $cap ) {
		if ( 'delete_term' === $cap ) {
			$caps = array( 'read' );
		}
		return $caps;
	}

	/**
	 * @ticket 38505
	 */
	public function test_delete_item_with_delete_term_cap_revoked() {
		wp_set_current_user( self::$administrator );
		$term = get_term_by( 'id', $this->factory->tag->create( array( 'name' => 'Deleted Tag' ) ), 'post_tag' );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/tags/' . $term->term_id );
		$request->set_param( 'force', true );

		add_filter( 'map_meta_cap', array( $this, 'revoke_delete_term' ), 10, 2 );
		$response = $this->server->dispatch( $request );
		remove_filter( 'map_meta_cap', array( $this, 'revoke_delete_term' ), 10, 2 );

		$this->assertErrorResponse( 'rest_cannot_delete', $response, 403 );
	}

	public function revoke_delete_term( $caps, $cap ) {
		if ( 'delete_term' === $cap ) {
			$caps = array( 'do_not_allow' );
		}
		return $caps;
	}

	public function test_prepare_item() {
		$term = get_term_by( 'id', $this->factory->tag->create(), 'post_tag' );
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags/' . $term->term_id );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();

		$this->check_taxonomy_term( $term, $data, $response->get_links() );
	}

	public function test_get_item_schema() {
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/tags' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertEquals( 8, count( $properties ) );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'count', $properties );
		$this->assertArrayHasKey( 'description', $properties );
		$this->assertArrayHasKey( 'link', $properties );
		$this->assertArrayHasKey( 'meta', $properties );
		$this->assertArrayHasKey( 'name', $properties );
		$this->assertArrayHasKey( 'slug', $properties );
		$this->assertArrayHasKey( 'taxonomy', $properties );
		$this->assertEquals( array_keys( get_taxonomies() ), $properties['taxonomy']['enum'] );
	}

	public function test_get_item_schema_non_hierarchical() {
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/tags' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertFalse( isset( $properties['parent'] ) );
	}

	public function test_get_additional_field_registration() {

		$schema = array(
			'type'        => 'integer',
			'description' => 'Some integer of mine',
			'enum'        => array( 1, 2, 3, 4 ),
			'context'     => array( 'view', 'edit' ),
		);

		register_rest_field( 'tag', 'my_custom_int', array(
			'schema'          => $schema,
			'get_callback'    => array( $this, 'additional_field_get_callback' ),
		) );

		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/tags' );

		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'my_custom_int', $data['schema']['properties'] );
		$this->assertEquals( $schema, $data['schema']['properties']['my_custom_int'] );

		$tag_id = $this->factory->tag->create();
		$request = new WP_REST_Request( 'GET', '/wp/v2/tags/' . $tag_id );

		$response = $this->server->dispatch( $request );
		$this->assertArrayHasKey( 'my_custom_int', $response->data );

		global $wp_rest_additional_fields;
		$wp_rest_additional_fields = array();
	}

	public function test_additional_field_update_errors() {
		$schema = array(
			'type'        => 'integer',
			'description' => 'Some integer of mine',
			'enum'        => array( 1, 2, 3, 4 ),
			'context'     => array( 'view', 'edit' ),
		);

		register_rest_field( 'tag', 'my_custom_int', array(
			'schema'          => $schema,
			'get_callback'    => array( $this, 'additional_field_get_callback' ),
			'update_callback' => array( $this, 'additional_field_update_callback' ),
		) );

		wp_set_current_user( self::$administrator );
		$tag_id = $this->factory->tag->create();
		// Check for error on update.
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/tags/%d', $tag_id ) );
		$request->set_body_params( array(
			'my_custom_int' => 'returnError',
		) );

		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );

		global $wp_rest_additional_fields;
		$wp_rest_additional_fields = array();
	}

	/**
	 * @ticket 38504
	 */
	public function test_object_term_queries_are_cached() {
		global $wpdb;

		$tags = $this->factory->tag->create_many( 2 );
		$p = $this->factory->post->create();
		wp_set_object_terms( $p, $tags[0], 'post_tag' );

		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'post', $p );
		$response = $this->server->dispatch( $request );
		$found_1 = wp_list_pluck( $response->data, 'id' );

		unset( $request, $response );

		$num_queries = $wpdb->num_queries;

		$request = new WP_REST_Request( 'GET', '/wp/v2/tags' );
		$request->set_param( 'post', $p );
		$response = $this->server->dispatch( $request );
		$found_2 = wp_list_pluck( $response->data, 'id' );

		$this->assertEqualSets( $found_1, $found_2 );
		$this->assertSame( $num_queries, $wpdb->num_queries );
	}

	public function additional_field_get_callback( $object, $request ) {
		return 123;
	}

	public function additional_field_update_callback( $value, $tag ) {
		if ( 'returnError' === $value ) {
			return new WP_Error( 'rest_invalid_param', 'Testing an error.', array( 'status' => 400 ) );
		}
	}

	public function tearDown() {
		_unregister_taxonomy( 'batman' );
		_unregister_taxonomy( 'robin' );
		parent::tearDown();
	}

	protected function check_get_taxonomy_terms_response( $response ) {
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$args = array(
			'hide_empty' => false,
		);
		$tags = get_terms( 'post_tag', $args );
		$this->assertEquals( count( $tags ), count( $data ) );
		$this->assertEquals( $tags[0]->term_id, $data[0]['id'] );
		$this->assertEquals( $tags[0]->name, $data[0]['name'] );
		$this->assertEquals( $tags[0]->slug, $data[0]['slug'] );
		$this->assertEquals( $tags[0]->taxonomy, $data[0]['taxonomy'] );
		$this->assertEquals( $tags[0]->description, $data[0]['description'] );
		$this->assertEquals( $tags[0]->count, $data[0]['count'] );
	}

	protected function check_taxonomy_term( $term, $data, $links ) {
		$this->assertEquals( $term->term_id, $data['id'] );
		$this->assertEquals( $term->name, $data['name'] );
		$this->assertEquals( $term->slug, $data['slug'] );
		$this->assertEquals( $term->description, $data['description'] );
		$this->assertEquals( get_term_link( $term ),  $data['link'] );
		$this->assertEquals( $term->count, $data['count'] );
		$taxonomy = get_taxonomy( $term->taxonomy );
		if ( $taxonomy->hierarchical ) {
			$this->assertEquals( $term->parent, $data['parent'] );
		} else {
			$this->assertFalse( isset( $data['parent'] ) );
		}
		$expected_links = array(
			'self',
			'collection',
			'about',
			'https://api.w.org/post_type',
		);
		if ( $taxonomy->hierarchical && $term->parent ) {
			$expected_links[] = 'up';
		}
		$this->assertEqualSets( $expected_links, array_keys( $links ) );
		$this->assertContains( 'wp/v2/taxonomies/' . $term->taxonomy, $links['about'][0]['href'] );
		$this->assertEquals( add_query_arg( 'tags', $term->term_id, rest_url( 'wp/v2/posts' ) ), $links['https://api.w.org/post_type'][0]['href'] );
	}

	protected function check_get_taxonomy_term_response( $response, $id ) {

		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$tag = get_term( $id, 'post_tag' );
		$this->check_taxonomy_term( $tag, $data, $response->get_links() );
	}
}
