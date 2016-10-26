<?php
/**
 * Unit tests covering WP_REST_Terms_Controller functionality, used for
 * Categories.
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi
 */
class WP_Test_REST_Categories_Controller extends WP_Test_REST_Controller_Testcase {

	public function setUp() {
		parent::setUp();
		$this->administrator = $this->factory->user->create( array(
			'role' => 'administrator',
		) );
		$this->subscriber = $this->factory->user->create( array(
			'role' => 'subscriber',
		) );
	}

	public function test_register_routes() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/wp/v2/categories', $routes );
		$this->assertArrayHasKey( '/wp/v2/categories/(?P<id>[\d]+)', $routes );
	}

	public function test_context_param() {
		// Collection
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/categories' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEqualSets( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
		// Single
		$category1 = $this->factory->category->create( array( 'name' => 'Season 5' ) );
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/categories/' . $category1 );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEqualSets( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	public function test_registered_query_params() {
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/categories' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$keys = array_keys( $data['endpoints'][0]['args'] );
		sort( $keys );
		$this->assertEquals( array(
			'context',
			'exclude',
			'hide_empty',
			'include',
			'order',
			'orderby',
			'page',
			'parent',
			'per_page',
			'post',
			'search',
			'slug',
			), $keys );
	}

	public function test_get_items() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$response = $this->server->dispatch( $request );
		$this->check_get_taxonomy_terms_response( $response );
	}

	public function test_get_items_invalid_permission_for_context() {
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_forbidden_context', $response, 401 );
	}

	public function test_get_items_hide_empty_arg() {
		$post_id = $this->factory->post->create();
		$category1 = $this->factory->category->create( array( 'name' => 'Season 5' ) );
		$category2 = $this->factory->category->create( array( 'name' => 'The Be Sharps' ) );
		wp_set_object_terms( $post_id, array( $category1, $category2 ), 'category' );
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'hide_empty', true );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 2, count( $data ) );
		$this->assertEquals( 'Season 5', $data[0]['name'] );
		$this->assertEquals( 'The Be Sharps', $data[1]['name'] );

		// Confirm the empty category "Uncategorized" category appears.
		$request->set_param( 'hide_empty', 'false' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 3, count( $data ) );
	}

	public function test_get_items_parent_zero_arg() {
		$parent1 = $this->factory->category->create( array( 'name' => 'Homer' ) );
		$parent2 = $this->factory->category->create( array( 'name' => 'Marge' ) );
		$this->factory->category->create(
			array(
				'name'   => 'Bart',
				'parent' => $parent1,
			)
		);
		$this->factory->category->create(
			array(
				'name'   => 'Lisa',
				'parent' => $parent2,
			)
		);
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'parent', 0 );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$args = array(
			'hide_empty' => false,
			'parent'     => 0,
		);
		$categories = get_terms( 'category', $args );
		$this->assertEquals( count( $categories ), count( $data ) );
	}

	public function test_get_items_parent_zero_arg_string() {
		$parent1 = $this->factory->category->create( array( 'name' => 'Homer' ) );
		$parent2 = $this->factory->category->create( array( 'name' => 'Marge' ) );
		$this->factory->category->create(
			array(
				'name'   => 'Bart',
				'parent' => $parent1,
			)
		);
		$this->factory->category->create(
			array(
				'name'   => 'Lisa',
				'parent' => $parent2,
			)
		);
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'parent', '0' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$args = array(
			'hide_empty' => false,
			'parent'     => 0,
		);
		$categories = get_terms( 'category', $args );
		$this->assertEquals( count( $categories ), count( $data ) );
	}

	public function test_get_items_by_parent_non_found() {
		$parent1 = $this->factory->category->create( array( 'name' => 'Homer' ) );

		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'parent', $parent1 );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertEquals( array(), $data );
	}

	public function test_get_items_invalid_page() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'page', 0 );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$data = $response->get_data();
		$first_error = array_shift( $data['data']['params'] );
		$this->assertContains( 'page must be greater than 1 (inclusive)', $first_error );
	}

	public function test_get_items_include_query() {
		$id1 = $this->factory->category->create();
		$this->factory->category->create();
		$id3 = $this->factory->category->create();
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
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
	}

	public function test_get_items_exclude_query() {
		$id1 = $this->factory->category->create();
		$id2 = $this->factory->category->create();
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertTrue( in_array( $id1, wp_list_pluck( $data, 'id' ), true ) );
		$this->assertTrue( in_array( $id2, wp_list_pluck( $data, 'id' ), true ) );
		$request->set_param( 'exclude', array( $id2 ) );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertTrue( in_array( $id1, wp_list_pluck( $data, 'id' ), true ) );
		$this->assertFalse( in_array( $id2, wp_list_pluck( $data, 'id' ), true ) );
	}

	public function test_get_items_orderby_args() {
		$this->factory->category->create( array( 'name' => 'Apple' ) );
		$this->factory->category->create( array( 'name' => 'Banana' ) );
		/*
		 * Tests:
		 * - orderby
		 * - order
		 * - per_page
		 */
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'orderby', 'name' );
		$request->set_param( 'order', 'desc' );
		$request->set_param( 'per_page', 1 );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 1, count( $data ) );
		$this->assertEquals( 'Uncategorized', $data[0]['name'] );
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'orderby', 'name' );
		$request->set_param( 'order', 'asc' );
		$request->set_param( 'per_page', 2 );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 2, count( $data ) );
		$this->assertEquals( 'Apple', $data[0]['name'] );
	}

	public function test_get_items_orderby_id() {
		$this->factory->category->create( array( 'name' => 'Cantaloupe' ) );
		$this->factory->category->create( array( 'name' => 'Apple' ) );
		$this->factory->category->create( array( 'name' => 'Banana' ) );
		// defaults to orderby=name, order=asc
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'Apple', $data[0]['name'] );
		$this->assertEquals( 'Banana', $data[1]['name'] );
		$this->assertEquals( 'Cantaloupe', $data[2]['name'] );
		$this->assertEquals( 'Uncategorized', $data[3]['name'] );
		// orderby=id, with default order=asc
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'orderby', 'id' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'Uncategorized', $data[0]['name'] );
		$this->assertEquals( 'Cantaloupe', $data[1]['name'] );
		$this->assertEquals( 'Apple', $data[2]['name'] );
		$this->assertEquals( 'Banana', $data[3]['name'] );
		// orderby=id, order=desc
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'orderby', 'id' );
		$request->set_param( 'order', 'desc' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'Banana', $data[0]['name'] );
		$this->assertEquals( 'Apple', $data[1]['name'] );
		$this->assertEquals( 'Cantaloupe', $data[2]['name'] );
	}

	protected function post_with_categories() {
		$post_id = $this->factory->post->create();
		$category1 = $this->factory->category->create( array(
			'name' => 'DC',
			'description' => 'Purveyor of fine detective comics',
		) );
		$category2 = $this->factory->category->create( array(
			'name' => 'Marvel',
			'description' => 'Home of the Marvel Universe',
		) );
		$category3 = $this->factory->category->create( array(
			'name' => 'Image',
			'description' => 'American independent comic publisher',
		) );
		wp_set_object_terms( $post_id, array( $category1, $category2, $category3 ), 'category' );

		return $post_id;
	}

	public function test_get_items_post_args() {
		$post_id = $this->post_with_categories();

		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'post', $post_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( 3, count( $data ) );

		// Check ordered by name by default
		$names = wp_list_pluck( $data, 'name' );
		$this->assertEquals( array( 'DC', 'Image', 'Marvel' ), $names );
	}

	public function test_get_items_post_ordered_by_description() {
		$post_id = $this->post_with_categories();

		// Regular request
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'orderby', 'description' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( 3, count( $data ) );
		$names = wp_list_pluck( $data, 'name' );
		$this->assertEquals( array( 'Image', 'Marvel', 'DC' ), $names, 'Terms should be ordered by description' );

		// Flip the order
		$request->set_param( 'order', 'desc' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( 3, count( $data ) );
		$names = wp_list_pluck( $data, 'name' );
		$this->assertEquals( array( 'DC', 'Marvel', 'Image' ), $names, 'Terms should be reverse-ordered by description' );
	}

	public function test_get_items_post_ordered_by_id() {
		$post_id = $this->post_with_categories();

		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'orderby', 'id' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( 3, count( $data ) );
		$names = wp_list_pluck( $data, 'name' );
		$this->assertEquals( array( 'DC', 'Marvel', 'Image' ), $names );
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
		$this->factory->category->create( array( 'name' => 'Apple' ) );
		$this->factory->category->create( array( 'name' => 'Banana' ) );
		/*
		 * Tests:
		 * - search
		 */
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'search', 'App' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 1, count( $data ) );
		$this->assertEquals( 'Apple', $data[0]['name'] );
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'search', 'Garbage' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 0, count( $data ) );
	}

	public function test_get_items_slug_arg() {
		$this->factory->category->create( array( 'name' => 'Apple' ) );
		$this->factory->category->create( array( 'name' => 'Banana' ) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'slug', 'apple' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 1, count( $data ) );
		$this->assertEquals( 'Apple', $data[0]['name'] );
	}

	public function test_get_terms_parent_arg() {
		$category1 = $this->factory->category->create( array( 'name' => 'Parent' ) );
		$this->factory->category->create( array( 'name' => 'Child', 'parent' => $category1 ) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'parent', $category1 );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 1, count( $data ) );
		$this->assertEquals( 'Child', $data[0]['name'] );
	}

	public function test_get_terms_private_taxonomy() {
		register_taxonomy( 'robin', 'post', array( 'public' => false ) );
		$this->factory->term->create( array( 'name' => 'Cape', 'taxonomy' => 'robin' ) );
		$this->factory->term->create( array( 'name' => 'Mask', 'taxonomy' => 'robin' ) );

		$request = new WP_REST_Request( 'GET', '/wp/v2/terms/robin' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_no_route', $response, 404 );
	}

	public function test_get_terms_invalid_taxonomy() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/invalid-taxonomy' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_no_route', $response, 404 );
	}

	public function test_get_terms_pagination_headers() {
		// Start of the index + Uncategorized default term
		for ( $i = 0; $i < 49; $i++ ) {
			$this->factory->category->create( array(
				'name'   => "Category {$i}",
				) );
		}
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$response = $this->server->dispatch( $request );
		$headers = $response->get_headers();
		$this->assertEquals( 50, $headers['X-WP-Total'] );
		$this->assertEquals( 5, $headers['X-WP-TotalPages'] );
		$this->assertCount( 10, $response->get_data() );
		$next_link = add_query_arg( array(
			'page'    => 2,
			), rest_url( 'wp/v2/categories' ) );
		$this->assertFalse( stripos( $headers['Link'], 'rel="prev"' ) );
		$this->assertContains( '<' . $next_link . '>; rel="next"', $headers['Link'] );
		// 3rd page
		$this->factory->category->create( array(
				'name'   => 'Category 51',
				) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'page', 3 );
		$response = $this->server->dispatch( $request );
		$headers = $response->get_headers();
		$this->assertEquals( 51, $headers['X-WP-Total'] );
		$this->assertEquals( 6, $headers['X-WP-TotalPages'] );
		$this->assertCount( 10, $response->get_data() );
		$prev_link = add_query_arg( array(
			'page'    => 2,
			), rest_url( 'wp/v2/categories' ) );
		$this->assertContains( '<' . $prev_link . '>; rel="prev"', $headers['Link'] );
		$next_link = add_query_arg( array(
			'page'    => 4,
			), rest_url( 'wp/v2/categories' ) );
		$this->assertContains( '<' . $next_link . '>; rel="next"', $headers['Link'] );
		// Last page
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'page', 6 );
		$response = $this->server->dispatch( $request );
		$headers = $response->get_headers();
		$this->assertEquals( 51, $headers['X-WP-Total'] );
		$this->assertEquals( 6, $headers['X-WP-TotalPages'] );
		$this->assertCount( 1, $response->get_data() );
		$prev_link = add_query_arg( array(
			'page'    => 5,
			), rest_url( 'wp/v2/categories' ) );
		$this->assertContains( '<' . $prev_link . '>; rel="prev"', $headers['Link'] );
		$this->assertFalse( stripos( $headers['Link'], 'rel="next"' ) );
		// Out of bounds
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'page', 8 );
		$response = $this->server->dispatch( $request );
		$headers = $response->get_headers();
		$this->assertEquals( 51, $headers['X-WP-Total'] );
		$this->assertEquals( 6, $headers['X-WP-TotalPages'] );
		$this->assertCount( 0, $response->get_data() );
		$prev_link = add_query_arg( array(
			'page'    => 6,
			), rest_url( 'wp/v2/categories' ) );
		$this->assertContains( '<' . $prev_link . '>; rel="prev"', $headers['Link'] );
		$this->assertFalse( stripos( $headers['Link'], 'rel="next"' ) );
	}

	public function test_get_items_per_page_exceeds_number_of_items() {
		// Start of the index + Uncategorized default term
		for ( $i = 0; $i < 17; $i++ ) {
			$this->factory->category->create( array(
				'name'   => "Category {$i}",
				) );
		}
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'page', 1 );
		$request->set_param( 'per_page', 100 );
		$response = $this->server->dispatch( $request );
		$headers = $response->get_headers();
		$this->assertEquals( 18, $headers['X-WP-Total'] );
		$this->assertEquals( 1, $headers['X-WP-TotalPages'] );
		$this->assertCount( 18, $response->get_data() );
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories' );
		$request->set_param( 'page', 2 );
		$request->set_param( 'per_page', 100 );
		$response = $this->server->dispatch( $request );
		$headers = $response->get_headers();
		$this->assertEquals( 18, $headers['X-WP-Total'] );
		$this->assertEquals( 1, $headers['X-WP-TotalPages'] );
		$this->assertCount( 0, $response->get_data() );
	}

	public function test_get_item() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories/1' );
		$response = $this->server->dispatch( $request );
		$this->check_get_taxonomy_term_response( $response );
	}

	public function test_get_term_invalid_taxonomy() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/invalid-taxonomy/1' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_no_route', $response, 404 );
	}

	public function test_get_term_invalid_term() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_term_invalid', $response, 404 );
	}

	public function test_get_item_invalid_permission_for_context() {
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories/1' );
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
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories/' . $term1 );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_term_invalid', $response, 404 );
	}

	public function test_create_item() {
		wp_set_current_user( $this->administrator );
		$request = new WP_REST_Request( 'POST', '/wp/v2/categories' );
		$request->set_param( 'name', 'My Awesome Term' );
		$request->set_param( 'description', 'This term is so awesome.' );
		$request->set_param( 'slug', 'so-awesome' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 201, $response->get_status() );
		$headers = $response->get_headers();
		$data = $response->get_data();
		$this->assertContains( '/wp/v2/categories/' . $data['id'], $headers['Location'] );
		$this->assertEquals( 'My Awesome Term', $data['name'] );
		$this->assertEquals( 'This term is so awesome.', $data['description'] );
		$this->assertEquals( 'so-awesome', $data['slug'] );
	}

	public function test_create_item_invalid_taxonomy() {
		wp_set_current_user( $this->administrator );
		$request = new WP_REST_Request( 'POST', '/wp/v2/invalid-taxonomy' );
		$request->set_param( 'name', 'Invalid Taxonomy' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_no_route', $response, 404 );
	}

	public function test_create_item_incorrect_permissions() {
		wp_set_current_user( $this->subscriber );
		$request = new WP_REST_Request( 'POST', '/wp/v2/categories' );
		$request->set_param( 'name', 'Incorrect permissions' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_create', $response, 403 );
	}

	public function test_create_item_missing_arguments() {
		wp_set_current_user( $this->administrator );
		$request = new WP_REST_Request( 'POST', '/wp/v2/categories' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_missing_callback_param', $response, 400 );
	}

	public function test_create_item_with_parent() {
		wp_set_current_user( $this->administrator );
		$parent = wp_insert_term( 'test-category', 'category' );
		$request = new WP_REST_Request( 'POST', '/wp/v2/categories' );
		$request->set_param( 'name', 'My Awesome Term' );
		$request->set_param( 'parent', $parent['term_id'] );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 201, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( $parent['term_id'], $data['parent'] );
	}

	public function test_create_item_invalid_parent() {
		wp_set_current_user( $this->administrator );
		$term = get_term_by( 'id', $this->factory->category->create(), 'category' );

		$request = new WP_REST_Request( 'POST', '/wp/v2/categories/' . $term->term_id );
		$request->set_param( 'name', 'My Awesome Term' );
		$request->set_param( 'parent', REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_term_invalid', $response, 400 );
	}

	public function test_update_item() {
		wp_set_current_user( $this->administrator );
		$orig_args = array(
			'name'        => 'Original Name',
			'description' => 'Original Description',
			'slug'        => 'original-slug',
			);
		$term = get_term_by( 'id', $this->factory->category->create( $orig_args ), 'category' );
		$request = new WP_REST_Request( 'POST', '/wp/v2/categories/' . $term->term_id );
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

	public function test_update_item_invalid_taxonomy() {
		wp_set_current_user( $this->administrator );
		$request = new WP_REST_Request( 'POST', '/wp/v2/invalid-taxonomy/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$request->set_param( 'name', 'Invalid Taxonomy' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_no_route', $response, 404 );
	}

	public function test_update_item_invalid_term() {
		wp_set_current_user( $this->administrator );
		$request = new WP_REST_Request( 'POST', '/wp/v2/categories/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$request->set_param( 'name', 'Invalid Term' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_term_invalid', $response, 404 );
	}

	public function test_update_item_incorrect_permissions() {
		wp_set_current_user( $this->subscriber );
		$term = get_term_by( 'id', $this->factory->category->create(), 'category' );
		$request = new WP_REST_Request( 'POST', '/wp/v2/categories/' . $term->term_id );
		$request->set_param( 'name', 'Incorrect permissions' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_update', $response, 403 );
	}

	public function test_update_item_parent() {
		wp_set_current_user( $this->administrator );
		$parent = get_term_by( 'id', $this->factory->category->create(), 'category' );
		$term = get_term_by( 'id', $this->factory->category->create(), 'category' );

		$request = new WP_REST_Request( 'POST', '/wp/v2/categories/' . $term->term_id );
		$request->set_param( 'parent', $parent->term_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( $parent->term_id, $data['parent'] );
	}

	public function test_update_item_invalid_parent() {
		wp_set_current_user( $this->administrator );
		$term = get_term_by( 'id', $this->factory->category->create(), 'category' );

		$request = new WP_REST_Request( 'POST', '/wp/v2/categories/' . $term->term_id );
		$request->set_param( 'parent', REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_term_invalid', $response, 400 );
	}

	public function test_delete_item() {
		wp_set_current_user( $this->administrator );
		$term = get_term_by( 'id', $this->factory->category->create( array( 'name' => 'Deleted Category' ) ), 'category' );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/categories/' . $term->term_id );
		$request->set_param( 'force', true );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'Deleted Category', $data['name'] );
	}

	public function test_delete_item_force_false() {
		wp_set_current_user( $this->administrator );
		$term = get_term_by( 'id', $this->factory->category->create( array( 'name' => 'Deleted Category' ) ), 'category' );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/categories/' . $term->term_id );
		// force defaults to false
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 501, $response->get_status() );
	}

	public function test_delete_item_invalid_taxonomy() {
		wp_set_current_user( $this->administrator );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/invalid-taxonomy/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_no_route', $response, 404 );
	}

	public function test_delete_item_invalid_term() {
		wp_set_current_user( $this->administrator );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/categories/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_term_invalid', $response, 404 );
	}

	public function test_delete_item_incorrect_permissions() {
		wp_set_current_user( $this->subscriber );
		$term = get_term_by( 'id', $this->factory->category->create(), 'category' );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/categories/' . $term->term_id );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_delete', $response, 403 );
	}

	public function test_prepare_item() {
		$term = get_term( 1, 'category' );

		$request = new WP_REST_Request( 'GET', '/wp/v2/categories/1' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();

		$this->check_taxonomy_term( $term, $data, $response->get_links() );
	}

	public function test_prepare_taxonomy_term_child() {
		$child = $this->factory->category->create( array(
			'parent' => 1,
		) );
		$term = get_term( $child, 'category' );

		$request = new WP_REST_Request( 'GET', '/wp/v2/categories/' . $child );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();

		$this->check_taxonomy_term( $term, $data, $response->get_links() );

		$this->assertEquals( 1, $data['parent'] );

		$links = $response->get_links();
		$this->assertEquals( rest_url( 'wp/v2/categories/1' ), $links['up'][0]['href'] );
	}

	public function test_get_item_schema() {
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/categories' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertEquals( 9, count( $properties ) );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'count', $properties );
		$this->assertArrayHasKey( 'description', $properties );
		$this->assertArrayHasKey( 'link', $properties );
		$this->assertArrayHasKey( 'meta', $properties );
		$this->assertArrayHasKey( 'name', $properties );
		$this->assertArrayHasKey( 'parent', $properties );
		$this->assertArrayHasKey( 'slug', $properties );
		$this->assertArrayHasKey( 'taxonomy', $properties );
		$this->assertEquals( array_keys( get_taxonomies() ), $properties['taxonomy']['enum'] );
	}

	public function test_get_additional_field_registration() {

		$schema = array(
			'type'        => 'integer',
			'description' => 'Some integer of mine',
			'enum'        => array( 1, 2, 3, 4 ),
			'context'     => array( 'view', 'edit' ),
		);

		register_rest_field( 'category', 'my_custom_int', array(
			'schema'          => $schema,
			'get_callback'    => array( $this, 'additional_field_get_callback' ),
		) );

		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/categories' );

		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'my_custom_int', $data['schema']['properties'] );
		$this->assertEquals( $schema, $data['schema']['properties']['my_custom_int'] );

		$category_id = $this->factory->category->create();
		$request = new WP_REST_Request( 'GET', '/wp/v2/categories/' . $category_id );

		$response = $this->server->dispatch( $request );
		$this->assertArrayHasKey( 'my_custom_int', $response->data );

		global $wp_rest_additional_fields;
		$wp_rest_additional_fields = array();
	}

	public function additional_field_get_callback( $object, $request ) {
		return 123;
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
		$categories = get_terms( 'category', $args );
		$this->assertEquals( count( $categories ), count( $data ) );
		$this->assertEquals( $categories[0]->term_id, $data[0]['id'] );
		$this->assertEquals( $categories[0]->name, $data[0]['name'] );
		$this->assertEquals( $categories[0]->slug, $data[0]['slug'] );
		$this->assertEquals( $categories[0]->taxonomy, $data[0]['taxonomy'] );
		$this->assertEquals( $categories[0]->description, $data[0]['description'] );
		$this->assertEquals( $categories[0]->count, $data[0]['count'] );
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
			$this->assertFalse( isset( $term->parent ) );
		}

		$relations = array(
			'self',
			'collection',
			'about',
			'https://api.w.org/post_type',
		);

		if ( ! empty( $data['parent'] ) ) {
			$relations[] = 'up';
		}

		$this->assertEqualSets( $relations, array_keys( $links ) );
		$this->assertContains( 'wp/v2/taxonomies/' . $term->taxonomy, $links['about'][0]['href'] );
		$this->assertEquals( add_query_arg( 'categories', $term->term_id, rest_url( 'wp/v2/posts' ) ), $links['https://api.w.org/post_type'][0]['href'] );
	}

	protected function check_get_taxonomy_term_response( $response ) {

		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$category = get_term( 1, 'category' );
		$this->check_taxonomy_term( $category, $data, $response->get_links() );
	}
}
