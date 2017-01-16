<?php
/**
 * Unit tests covering WP_REST_Users_Controller functionality.
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi
 */
class WP_Test_REST_Users_Controller extends WP_Test_REST_Controller_Testcase {
	protected static $superadmin;
	protected static $user;
	protected static $editor;
	protected static $draft_editor;
	protected static $authors = array();
	protected static $posts = array();
	protected static $site;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$superadmin = $factory->user->create( array(
			'role'       => 'administrator',
			'user_login' => 'superadmin',
		) );
		self::$user = $factory->user->create( array(
			'role' => 'administrator',
		) );
		self::$editor = $factory->user->create( array(
			'role'       => 'editor',
			'user_email' => 'editor@example.com',
		) );
		self::$draft_editor = $factory->user->create( array(
			'role'       => 'editor',
			'user_email' => 'draft-editor@example.com',
		) );

		foreach ( array( true, false ) as $show_in_rest ) {
			foreach ( array( true, false ) as $public ) {
				$post_type_name = 'r_' . json_encode( $show_in_rest ) . '_p_' . json_encode( $public );
				register_post_type( $post_type_name, array(
					'public'                   => $public,
					'show_in_rest'             => $show_in_rest,
					'tests_no_auto_unregister' => true,
				) );
				self::$authors[ $post_type_name ] = $factory->user->create( array(
					'role'       => 'editor',
					'user_email' => 'author_' . $post_type_name . '@example.com',
				) );
				self::$posts[ $post_type_name ] = $factory->post->create( array(
					'post_type'   => $post_type_name,
					'post_author' => self::$authors[ $post_type_name ],
				) );
			}
		}

		self::$posts['post'] = $factory->post->create( array(
			'post_type'   => 'post',
			'post_author' => self::$editor,
		) );
		self::$posts['r_true_p_true_DRAFT'] = $factory->post->create( array(
			'post_type'   => 'r_true_p_true',
			'post_author' => self::$draft_editor,
			'post_status' => 'draft',
		) );

		if ( is_multisite() ) {
			self::$site = $factory->blog->create( array( 'domain' => 'rest.wordpress.org', 'path' => '/' ) );
			update_site_option( 'site_admins', array( 'superadmin' ) );
		}
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$user );
		self::delete_user( self::$editor );
		self::delete_user( self::$draft_editor );

		foreach ( self::$posts as $post ) {
			wp_delete_post( $post, true );
		}
		foreach ( self::$authors as $author ) {
			self::delete_user( $author );
		}
		_unregister_post_type( 'r_true_p_true' );
		_unregister_post_type( 'r_true_p_false' );
		_unregister_post_type( 'r_false_p_true' );
		_unregister_post_type( 'r_false_p_false' );

		if ( is_multisite() ) {
			wpmu_delete_blog( self::$site, true );
		}
	}

	/**
	 * This function is run before each method
	 */
	public function setUp() {
		parent::setUp();
		$this->endpoint = new WP_REST_Users_Controller();
	}

	public function test_register_routes() {
		$routes = $this->server->get_routes();

		$this->assertArrayHasKey( '/wp/v2/users', $routes );
		$this->assertCount( 2, $routes['/wp/v2/users'] );
		$this->assertArrayHasKey( '/wp/v2/users/(?P<id>[\d]+)', $routes );
		$this->assertCount( 3, $routes['/wp/v2/users/(?P<id>[\d]+)'] );
		$this->assertArrayHasKey( '/wp/v2/users/me', $routes );
	}

	public function test_context_param() {
		// Collection
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/users' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
		// Single
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/users/' . self::$user );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	public function test_registered_query_params() {
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/users' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$keys = array_keys( $data['endpoints'][0]['args'] );
		sort( $keys );
		$this->assertEquals( array(
			'context',
			'exclude',
			'include',
			'offset',
			'order',
			'orderby',
			'page',
			'per_page',
			'roles',
			'search',
			'slug',
			), $keys );
	}

	public function test_get_items() {
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'context', 'view' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		$all_data = $response->get_data();
		$data = $all_data[0];
		$userdata = get_userdata( $data['id'] );
		$this->check_user_data( $userdata, $data, 'view', $data['_links'] );
	}

	public function test_get_items_with_edit_context() {
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		$all_data = $response->get_data();
		$data = $all_data[0];
		$userdata = get_userdata( $data['id'] );
		$this->check_user_data( $userdata, $data, 'edit', $data['_links'] );
	}

	public function test_get_items_with_edit_context_without_permission() {
		//test with a user not logged in
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );

		//test with a user logged in but without sufficient capabilities; capability in question: 'list_users'
		wp_set_current_user( self::$editor );
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
	}

	public function test_get_items_unauthenticated_includes_authors_of_post_types_shown_in_rest() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$response = $this->server->dispatch( $request );
		$users = $response->get_data();

		$rest_post_types = array_values( get_post_types( array( 'show_in_rest' => true ), 'names' ) );

		foreach ( $users as $user ) {
			$this->assertTrue( count_user_posts( $user['id'], $rest_post_types ) > 0 );

			// Ensure we don't expose non-public data.
			$this->assertArrayNotHasKey( 'capabilities', $user );
			$this->assertArrayNotHasKey( 'registered_date', $user );
			$this->assertArrayNotHasKey( 'first_name', $user );
			$this->assertArrayNotHasKey( 'last_name', $user );
			$this->assertArrayNotHasKey( 'nickname', $user );
			$this->assertArrayNotHasKey( 'extra_capabilities', $user );
			$this->assertArrayNotHasKey( 'username', $user );
			$this->assertArrayNotHasKey( 'email', $user );
			$this->assertArrayNotHasKey( 'roles', $user );
			$this->assertArrayNotHasKey( 'locale', $user );
		}

		$user_ids = wp_list_pluck( $users, 'id' );

		$this->assertTrue( in_array( self::$editor                   , $user_ids, true ) );
		$this->assertTrue( in_array( self::$authors['r_true_p_true'] , $user_ids, true ) );
		$this->assertTrue( in_array( self::$authors['r_true_p_false'], $user_ids, true ) );
		$this->assertCount( 3, $user_ids );
	}

	public function test_get_items_unauthenticated_does_not_include_authors_of_post_types_not_shown_in_rest() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$response = $this->server->dispatch( $request );
		$users = $response->get_data();
		$user_ids = wp_list_pluck( $users, 'id' );

		$this->assertFalse( in_array( self::$authors['r_false_p_true'] , $user_ids, true ) );
		$this->assertFalse( in_array( self::$authors['r_false_p_false'], $user_ids, true ) );
	}

	public function test_get_items_unauthenticated_does_not_include_users_without_published_posts() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$response = $this->server->dispatch( $request );
		$users = $response->get_data();
		$user_ids = wp_list_pluck( $users, 'id' );

		$this->assertFalse( in_array( self::$draft_editor, $user_ids, true ) );
		$this->assertFalse( in_array( self::$user        , $user_ids, true ) );
	}

	public function test_get_items_pagination_headers() {
		wp_set_current_user( self::$user );
		for ( $i = 0; $i < 44; $i++ ) {
			$this->factory->user->create( array(
				'name' => "User {$i}",
			) );
		}
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$response = $this->server->dispatch( $request );
		$headers = $response->get_headers();
		$this->assertEquals( 53, $headers['X-WP-Total'] );
		$this->assertEquals( 6, $headers['X-WP-TotalPages'] );
		$next_link = add_query_arg( array(
			'page'    => 2,
			), rest_url( 'wp/v2/users' ) );
		$this->assertFalse( stripos( $headers['Link'], 'rel="prev"' ) );
		$this->assertContains( '<' . $next_link . '>; rel="next"', $headers['Link'] );
		// 3rd page
		$this->factory->user->create( array(
				'name'   => 'User 51',
				) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'page', 3 );
		$response = $this->server->dispatch( $request );
		$headers = $response->get_headers();
		$this->assertEquals( 54, $headers['X-WP-Total'] );
		$this->assertEquals( 6, $headers['X-WP-TotalPages'] );
		$prev_link = add_query_arg( array(
			'page'    => 2,
			), rest_url( 'wp/v2/users' ) );
		$this->assertContains( '<' . $prev_link . '>; rel="prev"', $headers['Link'] );
		$next_link = add_query_arg( array(
			'page'    => 4,
			), rest_url( 'wp/v2/users' ) );
		$this->assertContains( '<' . $next_link . '>; rel="next"', $headers['Link'] );
		// Last page
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'page', 6 );
		$response = $this->server->dispatch( $request );
		$headers = $response->get_headers();
		$this->assertEquals( 54, $headers['X-WP-Total'] );
		$this->assertEquals( 6, $headers['X-WP-TotalPages'] );
		$prev_link = add_query_arg( array(
			'page'    => 5,
			), rest_url( 'wp/v2/users' ) );
		$this->assertContains( '<' . $prev_link . '>; rel="prev"', $headers['Link'] );
		$this->assertFalse( stripos( $headers['Link'], 'rel="next"' ) );
		// Out of bounds
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'page', 8 );
		$response = $this->server->dispatch( $request );
		$headers = $response->get_headers();
		$this->assertEquals( 54, $headers['X-WP-Total'] );
		$this->assertEquals( 6, $headers['X-WP-TotalPages'] );
		$prev_link = add_query_arg( array(
			'page'    => 6,
			), rest_url( 'wp/v2/users' ) );
		$this->assertContains( '<' . $prev_link . '>; rel="prev"', $headers['Link'] );
		$this->assertFalse( stripos( $headers['Link'], 'rel="next"' ) );
	}

	public function test_get_items_per_page() {
		wp_set_current_user( self::$user );
		for ( $i = 0; $i < 20; $i++ ) {
			$this->factory->user->create( array( 'display_name' => "User {$i}" ) );
		}
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 10, count( $response->get_data() ) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'per_page', 5 );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 5, count( $response->get_data() ) );
	}

	public function test_get_items_page() {
		wp_set_current_user( self::$user );
		for ( $i = 0; $i < 20; $i++ ) {
			$this->factory->user->create( array( 'display_name' => "User {$i}" ) );
		}
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'per_page', 5 );
		$request->set_param( 'page', 2 );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 5, count( $response->get_data() ) );
		$prev_link = add_query_arg( array(
			'per_page'  => 5,
			'page'      => 1,
			), rest_url( 'wp/v2/users' ) );
		$headers = $response->get_headers();
		$this->assertContains( '<' . $prev_link . '>; rel="prev"', $headers['Link'] );
	}

	public function test_get_items_orderby_name() {
		wp_set_current_user( self::$user );
		$low_id = $this->factory->user->create( array( 'display_name' => 'AAAAA' ) );
		$mid_id = $this->factory->user->create( array( 'display_name' => 'NNNNN' ) );
		$high_id = $this->factory->user->create( array( 'display_name' => 'ZZZZ' ) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'orderby', 'name' );
		$request->set_param( 'order', 'desc' );
		$request->set_param( 'per_page', 1 );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( $high_id, $data[0]['id'] );
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'orderby', 'name' );
		$request->set_param( 'order', 'asc' );
		$request->set_param( 'per_page', 1 );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( $low_id, $data[0]['id'] );
	}

	public function test_get_items_orderby_url() {
		wp_set_current_user( self::$user );

		$low_id = $this->factory->user->create( array( 'user_url' => 'http://a.com' ) );
		$high_id = $this->factory->user->create( array( 'user_url' => 'http://b.com' ) );

		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'orderby', 'url' );
		$request->set_param( 'order', 'desc' );
		$request->set_param( 'per_page', 1 );
		$request->set_param( 'include', array( $low_id, $high_id ) );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();

		$this->assertEquals( $high_id, $data[0]['id'] );

		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'orderby', 'url' );
		$request->set_param( 'order', 'asc' );
		$request->set_param( 'per_page', 1 );
		$request->set_param( 'include', array( $low_id, $high_id ) );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( $low_id, $data[0]['id'] );
	}

	public function test_get_items_orderby_slug() {
		wp_set_current_user( self::$user );

		$high_id = $this->factory->user->create( array( 'user_nicename' => 'blogin' ) );
		$low_id = $this->factory->user->create( array( 'user_nicename' => 'alogin' ) );

		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'orderby', 'slug' );
		$request->set_param( 'order', 'desc' );
		$request->set_param( 'per_page', 1 );
		$request->set_param( 'include', array( $low_id, $high_id ) );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();

		$this->assertEquals( $high_id, $data[0]['id'] );

		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'orderby', 'slug' );
		$request->set_param( 'order', 'asc' );
		$request->set_param( 'per_page', 1 );
		$request->set_param( 'include', array( $low_id, $high_id ) );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( $low_id, $data[0]['id'] );
	}

	public function test_get_items_orderby_email() {
		wp_set_current_user( self::$user );

		$high_id = $this->factory->user->create( array( 'user_email' => 'bemail@gmail.com' ) );
		$low_id = $this->factory->user->create( array( 'user_email' => 'aemail@gmail.com' ) );

		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'orderby', 'email' );
		$request->set_param( 'order', 'desc' );
		$request->set_param( 'per_page', 1 );
		$request->set_param( 'include', array( $low_id, $high_id ) );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( $high_id, $data[0]['id'] );

		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'orderby', 'email' );
		$request->set_param( 'order', 'asc' );
		$request->set_param( 'per_page', 1 );
		$request->set_param( 'include', array( $low_id, $high_id ) );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( $low_id, $data[0]['id'] );
	}

	public function test_get_items_orderby_email_unauthenticated() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'orderby', 'email' );
		$request->set_param( 'order', 'desc' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_forbidden_orderby', $response, 401 );
	}

	public function test_get_items_orderby_registered_date_unauthenticated() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'orderby', 'registered_date' );
		$request->set_param( 'order', 'desc' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_forbidden_orderby', $response, 401 );
	}

	public function test_get_items_invalid_order() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'order', 'asc,id' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_get_items_invalid_orderby() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'orderby', 'invalid' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_get_items_offset() {
		wp_set_current_user( self::$user );
		// 7 users created in wpSetUpBeforeClass(), plus default user.
		$this->factory->user->create();
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'offset', 1 );
		$response = $this->server->dispatch( $request );
		$this->assertCount( 9, $response->get_data() );
		// 'offset' works with 'per_page'
		$request->set_param( 'per_page', 2 );
		$response = $this->server->dispatch( $request );
		$this->assertCount( 2, $response->get_data() );
		// 'offset' takes priority over 'page'
		$request->set_param( 'page', 3 );
		$response = $this->server->dispatch( $request );
		$this->assertCount( 2, $response->get_data() );
		// 'offset' invalid value should error
		$request->set_param( 'offset', 'moreplease' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_get_items_include_query() {
		wp_set_current_user( self::$user );
		$id1 = $this->factory->user->create();
		$id2 = $this->factory->user->create();
		$id3 = $this->factory->user->create();
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
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
		// Invalid include should fail
		$request->set_param( 'include', 'invalid' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		// No privileges
		$request->set_param( 'include', array( $id3, $id1 ) );
		wp_set_current_user( 0 );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 0, count( $data ) );

	}

	public function test_get_items_exclude_query() {
		wp_set_current_user( self::$user );
		$id1 = $this->factory->user->create();
		$id2 = $this->factory->user->create();
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'per_page', 20 ); // there are >10 users at this point
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertTrue( in_array( $id1, wp_list_pluck( $data, 'id' ), true ) );
		$this->assertTrue( in_array( $id2, wp_list_pluck( $data, 'id' ), true ) );
		$request->set_param( 'exclude', array( $id2 ) );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertTrue( in_array( $id1, wp_list_pluck( $data, 'id' ), true ) );
		$this->assertFalse( in_array( $id2, wp_list_pluck( $data, 'id' ), true ) );
		// Invalid exlude value should error.
		$request->set_param( 'exclude', 'none-of-those-please' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_get_items_search() {
		wp_set_current_user( self::$user );
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'search', 'yololololo' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 0, count( $response->get_data() ) );
		$yolo_id = $this->factory->user->create( array( 'display_name' => 'yololololo' ) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'search', (string) $yolo_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 1, count( $response->get_data() ) );
		// default to wildcard search
		$adam_id = $this->factory->user->create( array(
			'role'          => 'author',
			'user_nicename' => 'adam',
		) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'search', 'ada' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 1, count( $data ) );
		$this->assertEquals( $adam_id, $data[0]['id'] );
	}

	public function test_get_items_slug_query() {
		wp_set_current_user( self::$user );
		$this->factory->user->create( array( 'display_name' => 'foo', 'user_login' => 'bar' ) );
		$id2 = $this->factory->user->create( array( 'display_name' => 'Moo', 'user_login' => 'foo' ) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'slug', 'foo' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 1, count( $data ) );
		$this->assertEquals( $id2, $data[0]['id'] );
	}

	// Note: Do not test using editor role as there is an editor role created in testing and it makes it hard to test this functionality.
	public function test_get_items_roles() {
		wp_set_current_user( self::$user );
		$tango = $this->factory->user->create( array( 'display_name' => 'tango', 'role' => 'subscriber' ) );
		$yolo  = $this->factory->user->create( array( 'display_name' => 'yolo', 'role' => 'author' ) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'roles', 'author,subscriber' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 2, count( $data ) );
		$this->assertEquals( $tango, $data[0]['id'] );
		$this->assertEquals( $yolo, $data[1]['id'] );
		$request->set_param( 'roles', 'author' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 1, count( $data ) );
		$this->assertEquals( $yolo, $data[0]['id'] );
		wp_set_current_user( 0 );
		$request->set_param( 'roles', 'author' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_user_cannot_view', $response, 401 );
		wp_set_current_user( self::$editor );
		$request->set_param( 'roles', 'author' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_user_cannot_view', $response, 403 );
	}

	public function test_get_items_invalid_roles() {
		wp_set_current_user( self::$user );
		$lolz = $this->factory->user->create( array( 'display_name' => 'lolz', 'role' => 'author' ) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'roles', 'ilovesteak,author' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 1, count( $data ) );
		$this->assertEquals( $lolz, $data[0]['id'] );
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'roles', 'steakisgood' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 0, count( $data ) );
		$this->assertEquals( array(), $data );
	}

	public function test_get_item() {
		$user_id = $this->factory->user->create();
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/users/%d', $user_id ) );

		$response = $this->server->dispatch( $request );
		$this->check_get_user_response( $response, 'embed' );
	}

	public function test_prepare_item() {
		wp_set_current_user( self::$user );
		$request = new WP_REST_Request;
		$request->set_param( 'context', 'edit' );
		$user = get_user_by( 'id', get_current_user_id() );
		$data = $this->endpoint->prepare_item_for_response( $user, $request );
		$this->check_get_user_response( $data, 'edit' );
	}

	public function test_get_user_avatar_urls() {
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/users/%d', self::$editor ) );

		$response = $this->server->dispatch( $request );

		$data = $response->get_data();
		$this->assertArrayHasKey( 24,  $data['avatar_urls'] );
		$this->assertArrayHasKey( 48,  $data['avatar_urls'] );
		$this->assertArrayHasKey( 96,  $data['avatar_urls'] );

		$user = get_user_by( 'id', self::$editor );
		/**
		 * Ignore the subdomain, since 'get_avatar_url randomly sets the Gravatar
		 * server when building the url string.
		 */
		$this->assertEquals( substr( get_avatar_url( $user->user_email ), 9 ), substr( $data['avatar_urls'][96], 9 ) );
	}

	public function test_get_user_invalid_id() {
		wp_set_current_user( self::$user );
		$request = new WP_REST_Request( 'GET', '/wp/v2/users/100' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_user_invalid_id', $response, 404 );
	}

	public function test_get_user_empty_capabilities() {
		wp_set_current_user( self::$user );
		$this->allow_user_to_manage_multisite();

		$lolz = $this->factory->user->create( array( 'display_name' => 'lolz', 'roles' => '' ) );
		delete_user_option( $lolz, 'capabilities' );
		delete_user_option( $lolz, 'user_level' );
		$request = new WP_REST_Request( 'GET', '/wp/v2/users/' . $lolz );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();

		$this->assertEquals( $data['capabilities'], new stdClass() );
		$this->assertEquals( $data['extra_capabilities'], new stdClass() );
	}

	public function test_cannot_get_item_without_permission() {
		wp_set_current_user( self::$editor );
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/users/%d', self::$user ) );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_user_cannot_view', $response, 403 );
	}

	public function test_can_get_item_author_of_rest_true_public_true_unauthenticated() {
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/users/%d', self::$authors['r_true_p_true'] ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_can_get_item_author_of_rest_true_public_true_authenticated() {
		wp_set_current_user( self::$editor );
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/users/%d', self::$authors['r_true_p_true'] ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_can_get_item_author_of_rest_true_public_false() {
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/users/%d', self::$authors['r_true_p_false'] ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_cannot_get_item_author_of_rest_false_public_true_unauthenticated() {
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/users/%d', self::$authors['r_false_p_true'] ) );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_user_cannot_view', $response, 401 );
	}

	public function test_cannot_get_item_author_of_rest_false_public_true_without_permission() {
		wp_set_current_user( self::$editor );
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/users/%d', self::$authors['r_false_p_true'] ) );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_user_cannot_view', $response, 403 );
	}

	public function test_cannot_get_item_author_of_rest_false_public_false() {
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/users/%d', self::$authors['r_false_p_false'] ) );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_user_cannot_view', $response, 401 );
	}

	public function test_can_get_item_author_of_post() {
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/users/%d', self::$editor ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_cannot_get_item_author_of_draft() {
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/users/%d', self::$draft_editor ) );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_user_cannot_view', $response, 401 );
	}

	public function test_get_item_published_author_post() {
		$this->author_id = $this->factory->user->create( array(
			'role' => 'author',
		) );
		$this->post_id = $this->factory->post->create( array(
			'post_author' => $this->author_id,
		));
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/users/%d', $this->author_id ) );
		$response = $this->server->dispatch( $request );
		$this->check_get_user_response( $response, 'embed' );
	}

	public function test_get_item_published_author_pages() {
		$this->author_id = $this->factory->user->create( array(
			'role' => 'author',
		) );
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/users/%d', $this->author_id ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
		$this->post_id = $this->factory->post->create( array(
			'post_author' => $this->author_id,
			'post_type'   => 'page',
		));
		$response = $this->server->dispatch( $request );
		$this->check_get_user_response( $response, 'embed' );
	}

	public function test_get_user_with_edit_context() {
		$user_id = $this->factory->user->create();
		$this->allow_user_to_manage_multisite();

		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request->set_param( 'context', 'edit' );

		$response = $this->server->dispatch( $request );
		$this->check_get_user_response( $response, 'edit' );
	}

	public function test_get_item_published_author_wrong_context() {
		$this->author_id = $this->factory->user->create( array(
			'role' => 'author',
		) );
		$this->post_id = $this->factory->post->create( array(
			'post_author' => $this->author_id,
		));
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/users/%d', $this->author_id ) );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_user_cannot_view', $response, 401 );
	}

	public function test_get_current_user() {
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'GET', '/wp/v2/users/me' );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->check_get_user_response( $response, 'view' );

		$headers = $response->get_headers();
		$this->assertArrayNotHasKey( 'Location', $headers );

		$links = $response->get_links();
		$this->assertEquals( rest_url( 'wp/v2/users/' . self::$user ), $links['self'][0]['href'] );
	}

	public function test_get_current_user_without_permission() {
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', '/wp/v2/users/me' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_not_logged_in', $response, 401 );
	}

	public function test_create_item() {
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$params = array(
			'username'    => 'testuser',
			'password'    => 'testpassword',
			'email'       => 'test@example.com',
			'name'        => 'Test User',
			'nickname'    => 'testuser',
			'slug'        => 'test-user',
			'roles'       => array( 'editor' ),
			'description' => 'New API User',
			'url'         => 'http://example.com',
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/users' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );

		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 'http://example.com', $data['url'] );
		$this->assertEquals( array( 'editor' ), $data['roles'] );
		$this->check_add_edit_user_response( $response );
	}

	public function test_create_item_invalid_username() {
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$params = array(
			'username'    => '¯\_(ツ)_/¯',
			'password'    => 'testpassword',
			'email'       => 'test@example.com',
			'name'        => 'Test User',
			'nickname'    => 'testuser',
			'slug'        => 'test-user',
			'roles'       => array( 'editor' ),
			'description' => 'New API User',
			'url'         => 'http://example.com',
		);

		// Username rules are different (more strict) for multisite; see `wpmu_validate_user_signup`
		if ( is_multisite() ) {
			$params['username'] = 'no-dashes-allowed';
		}

		$request = new WP_REST_Request( 'POST', '/wp/v2/users' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );

		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );

		$data = $response->get_data();
		if ( is_multisite() ) {
			$this->assertInternalType( 'array', $data['additional_errors'] );
			$this->assertCount( 1, $data['additional_errors'] );
			$error = $data['additional_errors'][0];
			$this->assertEquals( 'user_name', $error['code'] );
			$this->assertEquals( 'Usernames can only contain lowercase letters (a-z) and numbers.', $error['message'] );
		} else {
			$this->assertInternalType( 'array', $data['data']['params'] );
			$errors = $data['data']['params'];
			$this->assertInternalType( 'string', $errors['username'] );
			$this->assertEquals( 'Username contains invalid characters.', $errors['username'] );
		}
	}

	function get_illegal_user_logins() {
		return array( 'nope' );
	}

	public function test_create_item_illegal_username() {
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		add_filter( 'illegal_user_logins', array( $this, 'get_illegal_user_logins' ) );

		$params = array(
			'username'    => 'nope',
			'password'    => 'testpassword',
			'email'       => 'test@example.com',
			'name'        => 'Test User',
			'nickname'    => 'testuser',
			'slug'        => 'test-user',
			'roles'       => array( 'editor' ),
			'description' => 'New API User',
			'url'         => 'http://example.com',
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/users' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );

		$response = $this->server->dispatch( $request );

		remove_filter( 'illegal_user_logins', array( $this, 'get_illegal_user_logins' ) );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );

		$data = $response->get_data();
		$this->assertInternalType( 'array', $data['data']['params'] );
		$errors = $data['data']['params'];
		$this->assertInternalType( 'string', $errors['username'] );
		$this->assertEquals( 'Sorry, that username is not allowed.', $errors['username'] );
	}

	public function test_create_new_network_user_on_site_does_not_add_user_to_sub_site() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Test requires multisite.' );
		}

		$this->allow_user_to_manage_multisite();

		$params = array(
			'username' => 'testuser123',
			'password' => 'testpassword',
			'email'    => 'test@example.com',
			'name'     => 'Test User 123',
			'roles'    => array( 'editor' ),
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/users' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$user_id = $data['id'];

		$user_is_member = is_user_member_of_blog( $user_id, self::$site );

		wpmu_delete_user( $user_id );

		$this->assertFalse( $user_is_member );
	}

	public function test_create_new_network_user_on_sub_site_adds_user_to_site() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Test requires multisite.' );
		}

		$this->allow_user_to_manage_multisite();

		$params = array(
			'username' => 'testuser123',
			'password' => 'testpassword',
			'email'    => 'test@example.com',
			'name'     => 'Test User 123',
			'roles'    => array( 'editor' ),
		);

		switch_to_blog( self::$site );

		$request = new WP_REST_Request( 'POST', '/wp/v2/users' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$user_id = $data['id'];

		restore_current_blog();

		$user_is_member = is_user_member_of_blog( $user_id, self::$site );

		wpmu_delete_user( $user_id );

		$this->assertTrue( $user_is_member );
	}

	public function test_create_existing_network_user_on_sub_site_has_error() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Test requires multisite.' );
		}

		$this->allow_user_to_manage_multisite();

		$params = array(
			'username' => 'testuser123',
			'password' => 'testpassword',
			'email'    => 'test@example.com',
			'name'     => 'Test User 123',
			'roles'    => array( 'editor' ),
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/users' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$user_id = $data['id'];

		switch_to_blog( self::$site );

		$request = new WP_REST_Request( 'POST', '/wp/v2/users' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );
		$switched_response = $this->server->dispatch( $request );

		restore_current_blog();

		wpmu_delete_user( $user_id );

		$this->assertErrorResponse( 'rest_invalid_param', $switched_response, 400 );
		$data = $switched_response->get_data();
		$this->assertInternalType( 'array', $data['additional_errors'] );
		$this->assertCount( 2, $data['additional_errors'] );
		$errors = $data['additional_errors'];
		foreach ( $errors as $error ) {
			// Check the code matches one we know.
			$this->assertContains( $error['code'], array( 'user_name', 'user_email' ) );
			if ( 'user_name' === $error['code'] ) {
				$this->assertEquals( 'Sorry, that username already exists!', $error['message'] );
			} else {
				$this->assertEquals( 'Sorry, that email address is already used!', $error['message'] );
			}
		}
	}

	public function test_update_existing_network_user_on_sub_site_adds_user_to_site() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Test requires multisite.' );
		}

		$this->allow_user_to_manage_multisite();

		$params = array(
			'username' => 'testuser123',
			'password' => 'testpassword',
			'email'    => 'test@example.com',
			'name'     => 'Test User 123',
			'roles'    => array( 'editor' ),
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/users' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$user_id = $data['id'];

		switch_to_blog( self::$site );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/users/' . $user_id );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );
		$this->server->dispatch( $request );

		restore_current_blog();

		$user_is_member = is_user_member_of_blog( $user_id, self::$site );

		wpmu_delete_user( $user_id );

		$this->assertTrue( $user_is_member );
	}

	public function test_json_create_user() {
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$params = array(
			'username' => 'testjsonuser',
			'password' => 'testjsonpassword',
			'email'    => 'testjson@example.com',
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/users' );
		$request->add_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );

		$response = $this->server->dispatch( $request );
		$this->check_add_edit_user_response( $response );
	}

	public function test_create_user_without_permission() {
		wp_set_current_user( self::$editor );

		$params = array(
			'username' => 'homersimpson',
			'password' => 'stupidsexyflanders',
			'email'    => 'chunkylover53@aol.com',
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/users' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_create_user', $response, 403 );
	}

	public function test_create_user_invalid_id() {
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$params = array(
			'id'       => '156',
			'username' => 'lisasimpson',
			'password' => 'DavidHasselhoff',
			'email'    => 'smartgirl63_@yahoo.com',
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/users' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_user_exists', $response, 400 );
	}

	public function test_create_user_invalid_email() {
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$params = array(
			'username' => 'lisasimpson',
			'password' => 'DavidHasselhoff',
			'email'    => 'something',
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/users' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_create_user_invalid_role() {
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$params = array(
			'username' => 'maggiesimpson',
			'password' => 'i_shot_mrburns',
			'email'    => 'packingheat@example.com',
			'roles'    => array( 'baby' ),
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/users' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_user_invalid_role', $response, 400 );
	}

	public function test_update_item() {
		$user_id = $this->factory->user->create( array(
			'user_email' => 'test@example.com',
			'user_pass' => 'sjflsfls',
			'user_login' => 'test_update',
			'first_name' => 'Old Name',
			'user_url' => 'http://apple.com',
			'locale' => 'en_US',
		));
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$userdata = get_userdata( $user_id );
		$pw_before = $userdata->user_pass;

		$_POST['email'] = $userdata->user_email;
		$_POST['username'] = $userdata->user_login;
		$_POST['first_name'] = 'New Name';
		$_POST['url'] = 'http://google.com';
		$_POST['locale'] = 'de_DE';

		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $_POST );

		$response = $this->server->dispatch( $request );
		$this->check_add_edit_user_response( $response, true );

		// Check that the name has been updated correctly
		$new_data = $response->get_data();
		$this->assertEquals( 'New Name', $new_data['first_name'] );
		$user = get_userdata( $user_id );
		$this->assertEquals( 'New Name', $user->first_name );

		$this->assertEquals( 'http://google.com', $new_data['url'] );
		$this->assertEquals( 'http://google.com', $user->user_url );
		$this->assertEquals( 'de_DE', $user->locale );

		// Check that we haven't inadvertently changed the user's password,
		// as per https://core.trac.wordpress.org/ticket/21429
		$this->assertEquals( $pw_before, $user->user_pass );
	}

	public function test_update_item_no_change() {
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );
		$user = get_userdata( self::$editor );

		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/users/%d', self::$editor ) );
		$request->set_param( 'slug', $user->user_nicename );

		// Run twice to make sure that the update still succeeds even if no DB
		// rows are updated.
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_update_item_existing_email() {
		$user1 = $this->factory->user->create( array( 'user_login' => 'test_json_user', 'user_email' => 'testjson@example.com' ) );
		$user2 = $this->factory->user->create( array( 'user_login' => 'test_json_user2', 'user_email' => 'testjson2@example.com' ) );
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/users/' . $user2 );
		$request->set_param( 'email', 'testjson@example.com' );
		$response = $this->server->dispatch( $request );
		$this->assertInstanceOf( 'WP_Error', $response->as_error() );
		$this->assertEquals( 'rest_user_invalid_email', $response->as_error()->get_error_code() );
	}

	public function test_update_item_invalid_locale() {
		$user1 = $this->factory->user->create( array( 'user_login' => 'test_json_user', 'user_email' => 'testjson@example.com' ) );
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/users/' . $user1 );
		$request->set_param( 'locale', 'klingon' );
		$response = $this->server->dispatch( $request );
		$this->assertInstanceOf( 'WP_Error', $response->as_error() );
		$this->assertEquals( 'rest_invalid_param', $response->as_error()->get_error_code() );
	}

	public function test_update_item_en_US_locale() {
		$user_id = $this->factory->user->create( array( 'user_login' => 'test_json_user', 'user_email' => 'testjson@example.com' ) );
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/users/' . $user_id );
		$request->set_param( 'locale', 'en_US' );
		$response = $this->server->dispatch( $request );
		$this->check_add_edit_user_response( $response, true );

		$user = get_userdata( $user_id );
		$this->assertEquals( 'en_US', $user->locale );
	}

	/**
	 * @ticket 38632
	 */
	public function test_update_item_empty_locale() {
		$user_id = $this->factory->user->create( array( 'user_login' => 'test_json_user', 'user_email' => 'testjson@example.com', 'locale' => 'de_DE' ) );
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/users/' . $user_id );
		$request->set_param( 'locale', '' );
		$response = $this->server->dispatch( $request );
		$this->check_add_edit_user_response( $response, true );

		$data = $response->get_data();
		$this->assertEquals( get_locale(), $data['locale'] );
		$user = get_userdata( $user_id );
		$this->assertEquals( '', $user->locale );
	}

	public function test_update_item_username_attempt() {
		$user1 = $this->factory->user->create( array( 'user_login' => 'test_json_user', 'user_email' => 'testjson@example.com' ) );
		$user2 = $this->factory->user->create( array( 'user_login' => 'test_json_user2', 'user_email' => 'testjson2@example.com' ) );
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/users/' . $user2 );
		$request->set_param( 'username', 'test_json_user' );
		$response = $this->server->dispatch( $request );
		$this->assertInstanceOf( 'WP_Error', $response->as_error() );
		$this->assertEquals( 'rest_user_invalid_argument', $response->as_error()->get_error_code() );
	}

	public function test_update_item_existing_nicename() {
		$user1 = $this->factory->user->create( array( 'user_login' => 'test_json_user', 'user_email' => 'testjson@example.com' ) );
		$user2 = $this->factory->user->create( array( 'user_login' => 'test_json_user2', 'user_email' => 'testjson2@example.com' ) );
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/users/' . $user2 );
		$request->set_param( 'slug', 'test_json_user' );
		$response = $this->server->dispatch( $request );
		$this->assertInstanceOf( 'WP_Error', $response->as_error() );
		$this->assertEquals( 'rest_user_invalid_slug', $response->as_error()->get_error_code() );
	}

	public function test_json_update_user() {
		$user_id = $this->factory->user->create( array(
			'user_email' => 'testjson2@example.com',
			'user_pass'  => 'sjflsfl3sdjls',
			'user_login' => 'test_json_update',
			'first_name' => 'Old Name',
			'last_name'  => 'Original Last',
		));
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$params = array(
			'username'   => 'test_json_update',
			'email'      => 'testjson2@example.com',
			'first_name' => 'JSON Name',
			'last_name'  => 'New Last',
		);

		$userdata = get_userdata( $user_id );
		$pw_before = $userdata->user_pass;

		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request->add_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );

		$response = $this->server->dispatch( $request );
		$this->check_add_edit_user_response( $response, true );

		// Check that the name has been updated correctly
		$new_data = $response->get_data();
		$this->assertEquals( 'JSON Name', $new_data['first_name'] );
		$this->assertEquals( 'New Last', $new_data['last_name'] );
		$user = get_userdata( $user_id );
		$this->assertEquals( 'JSON Name', $user->first_name );
		$this->assertEquals( 'New Last', $user->last_name );

		// Check that we haven't inadvertently changed the user's password,
		// as per https://core.trac.wordpress.org/ticket/21429
		$this->assertEquals( $pw_before, $user->user_pass );
	}

	public function test_update_user_role() {
		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( self::$user );
		$this->allow_user_to_manage_multisite();

		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request->set_param( 'roles', array( 'editor' ) );
		$response = $this->server->dispatch( $request );

		$new_data = $response->get_data();

		$this->assertEquals( 'editor', $new_data['roles'][0] );
		$this->assertNotEquals( 'administrator', $new_data['roles'][0] );

		$user = get_userdata( $user_id );
		$this->assertArrayHasKey( 'editor', $user->caps );
		$this->assertArrayNotHasKey( 'administrator', $user->caps );
	}

	public function test_update_user_multiple_roles() {
		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( self::$user );
		$this->allow_user_to_manage_multisite();

		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request->set_param( 'roles', 'author,editor' );
		$response = $this->server->dispatch( $request );

		$new_data = $response->get_data();

		$this->assertEquals( array( 'author', 'editor' ), $new_data['roles'] );

		$user = get_userdata( $user_id );
		$this->assertArrayHasKey( 'author', $user->caps );
		$this->assertArrayHasKey( 'editor', $user->caps );
		$this->assertArrayNotHasKey( 'administrator', $user->caps );
	}

	public function test_update_user_role_invalid_privilege_escalation() {
		wp_set_current_user( self::$editor );

		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/users/%d', self::$editor ) );
		$request->set_param( 'roles', array( 'administrator' ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_edit_roles', $response, 403 );
		$user = get_userdata( self::$editor );
		$this->assertArrayHasKey( 'editor', $user->caps );
		$this->assertArrayNotHasKey( 'administrator', $user->caps );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/users/me' );
		$request->set_param( 'roles', array( 'administrator' ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_edit_roles', $response, 403 );
		$user = get_userdata( self::$editor );
		$this->assertArrayHasKey( 'editor', $user->caps );
		$this->assertArrayNotHasKey( 'administrator', $user->caps );
	}

	public function test_update_user_role_invalid_privilege_deescalation() {
		if ( is_multisite() ) {
			return $this->markTestSkipped( 'Test only intended for single site.' );
		}

		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( $user_id );

		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request->set_param( 'roles', array( 'editor' ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_user_invalid_role', $response, 403 );

		$user = get_userdata( $user_id );
		$this->assertArrayHasKey( 'administrator', $user->caps );
		$this->assertArrayNotHasKey( 'editor', $user->caps );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/users/me' );
		$request->set_param( 'roles', array( 'editor' ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_user_invalid_role', $response, 403 );

		$user = get_userdata( $user_id );
		$this->assertArrayHasKey( 'administrator', $user->caps );
		$this->assertArrayNotHasKey( 'editor', $user->caps );
	}

	public function test_update_user_role_privilege_deescalation_multisite() {
		if ( ! is_multisite() ) {
			return $this->markTestSkipped( 'Test only intended for multisite.' );
		}

		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( $user_id );
		$user = wp_get_current_user();
		update_site_option( 'site_admins', array( $user->user_login ) );

		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request->set_param( 'roles', array( 'editor' ) );
		$response = $this->server->dispatch( $request );

		$new_data = $response->get_data();
		$this->assertEquals( 'editor', $new_data['roles'][0] );
		$this->assertNotEquals( 'administrator', $new_data['roles'][0] );

		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( $user_id );
		$user = wp_get_current_user();
		update_site_option( 'site_admins', array( $user->user_login ) );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/users/me' );
		$request->set_param( 'roles', array( 'editor' ) );
		$response = $this->server->dispatch( $request );

		$new_data = $response->get_data();
		$this->assertEquals( 'editor', $new_data['roles'][0] );
		$this->assertNotEquals( 'administrator', $new_data['roles'][0] );
	}


	public function test_update_user_role_invalid_role() {
		wp_set_current_user( self::$user );
		$this->allow_user_to_manage_multisite();

		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/users/%d', self::$editor ) );
		$request->set_param( 'roles', array( 'BeSharp' ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_user_invalid_role', $response, 400 );

		$user = get_userdata( self::$editor );
		$this->assertArrayHasKey( 'editor', $user->caps );
		$this->assertArrayNotHasKey( 'BeSharp', $user->caps );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/users/me' );
		$request->set_param( 'roles', array( 'BeSharp' ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_user_invalid_role', $response, 400 );

		$user = get_userdata( self::$editor );
		$this->assertArrayHasKey( 'editor', $user->caps );
		$this->assertArrayNotHasKey( 'BeSharp', $user->caps );
	}

	public function test_update_user_without_permission() {
		wp_set_current_user( self::$editor );

		$params = array(
			'username' => 'homersimpson',
			'password' => 'stupidsexyflanders',
			'email'    => 'chunkylover53@aol.com',
		);

		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/users/%d', self::$user ) );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/users/me' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_user_invalid_argument', $response, 400 );
	}

	public function test_update_user_invalid_id() {
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$params = array(
			'id'       => '156',
			'username' => 'lisasimpson',
			'password' => 'DavidHasselhoff',
			'email'    => 'smartgirl63_@yahoo.com',
		);

		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/users/%d', self::$editor ) );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_user_invalid_id', $response, 404 );
	}

	public function test_update_item_invalid_password() {
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/users/%d', self::$editor ) );

		$request->set_param( 'password', 'no\\backslashes\\allowed' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );

		$request->set_param( 'password', '' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function verify_user_roundtrip( $input = array(), $expected_output = array() ) {
		if ( isset( $input['id'] ) ) {
			// Existing user; don't try to create one
			$user_id = $input['id'];
		} else {
			// Create a new user
			$request = new WP_REST_Request( 'POST', '/wp/v2/users' );
			foreach ( $input as $name => $value ) {
				$request->set_param( $name, $value );
			}
			$request->set_param( 'email', 'cbg@androidsdungeon.com' );
			$response = $this->server->dispatch( $request );
			$this->assertEquals( 201, $response->get_status() );
			$actual_output = $response->get_data();

			// Compare expected API output to actual API output
			$this->assertEquals( $expected_output['username']   , $actual_output['username'] );
			$this->assertEquals( $expected_output['name']       , $actual_output['name'] );
			$this->assertEquals( $expected_output['first_name'] , $actual_output['first_name'] );
			$this->assertEquals( $expected_output['last_name']  , $actual_output['last_name'] );
			$this->assertEquals( $expected_output['url']        , $actual_output['url'] );
			$this->assertEquals( $expected_output['description'], $actual_output['description'] );
			$this->assertEquals( $expected_output['nickname']   , $actual_output['nickname'] );

			// Compare expected API output to WP internal values
			$user = get_userdata( $actual_output['id'] );
			$this->assertEquals( $expected_output['username']   , $user->user_login );
			$this->assertEquals( $expected_output['name']       , $user->display_name );
			$this->assertEquals( $expected_output['first_name'] , $user->first_name );
			$this->assertEquals( $expected_output['last_name']  , $user->last_name );
			$this->assertEquals( $expected_output['url']        , $user->user_url );
			$this->assertEquals( $expected_output['description'], $user->description );
			$this->assertEquals( $expected_output['nickname']   , $user->nickname );
			$this->assertTrue( wp_check_password( addslashes( $expected_output['password'] ), $user->user_pass ) );

			$user_id = $actual_output['id'];
		}

		// Update the user
		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/users/%d', $user_id ) );
		foreach ( $input as $name => $value ) {
			if ( 'username' !== $name ) {
				$request->set_param( $name, $value );
			}
		}
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$actual_output = $response->get_data();

		// Compare expected API output to actual API output
		if ( isset( $expected_output['username'] ) ) {
			$this->assertEquals( $expected_output['username'], $actual_output['username'] );
		}
		$this->assertEquals( $expected_output['name']       , $actual_output['name'] );
		$this->assertEquals( $expected_output['first_name'] , $actual_output['first_name'] );
		$this->assertEquals( $expected_output['last_name']  , $actual_output['last_name'] );
		$this->assertEquals( $expected_output['url']        , $actual_output['url'] );
		$this->assertEquals( $expected_output['description'], $actual_output['description'] );
		$this->assertEquals( $expected_output['nickname']   , $actual_output['nickname'] );

		// Compare expected API output to WP internal values
		$user = get_userdata( $actual_output['id'] );
		if ( isset( $expected_output['username'] ) ) {
			$this->assertEquals( $expected_output['username'], $user->user_login );
		}
		$this->assertEquals( $expected_output['name']       , $user->display_name );
		$this->assertEquals( $expected_output['first_name'] , $user->first_name );
		$this->assertEquals( $expected_output['last_name']  , $user->last_name );
		$this->assertEquals( $expected_output['url']        , $user->user_url );
		$this->assertEquals( $expected_output['description'], $user->description );
		$this->assertEquals( $expected_output['nickname']   , $user->nickname );
		$this->assertTrue( wp_check_password( addslashes( $expected_output['password'] ), $user->user_pass ) );
	}

	public function test_user_roundtrip_as_editor() {
		wp_set_current_user( self::$editor );
		$this->assertEquals( ! is_multisite(), current_user_can( 'unfiltered_html' ) );
		$this->verify_user_roundtrip( array(
			'id'          => self::$editor,
			'name'        => '\o/ ¯\_(ツ)_/¯',
			'first_name'  => '\o/ ¯\_(ツ)_/¯',
			'last_name'   => '\o/ ¯\_(ツ)_/¯',
			'url'         => '\o/ ¯\_(ツ)_/¯',
			'description' => '\o/ ¯\_(ツ)_/¯',
			'nickname'    => '\o/ ¯\_(ツ)_/¯',
			'password'    => 'o/ ¯_(ツ)_/¯ \'"',
		), array(
			'name'        => '\o/ ¯\_(ツ)_/¯',
			'first_name'  => '\o/ ¯\_(ツ)_/¯',
			'last_name'   => '\o/ ¯\_(ツ)_/¯',
			'url'         => 'http://o/%20¯_(ツ)_/¯',
			'description' => '\o/ ¯\_(ツ)_/¯',
			'nickname'    => '\o/ ¯\_(ツ)_/¯',
			'password'    => 'o/ ¯_(ツ)_/¯ \'"',
		) );
	}

	public function test_user_roundtrip_as_editor_html() {
		wp_set_current_user( self::$editor );
		if ( is_multisite() ) {
			$this->assertFalse( current_user_can( 'unfiltered_html' ) );
			$this->verify_user_roundtrip( array(
				'id'          => self::$editor,
				'name'        => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'first_name'  => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'last_name'   => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'url'         => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'description' => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'nickname'    => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'password'    => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			), array(
				'name'        => 'div strong',
				'first_name'  => 'div strong',
				'last_name'   => 'div strong',
				'url'         => 'http://divdiv/div%20strongstrong/strong%20scriptoh%20noes/script',
				'description' => 'div <strong>strong</strong> oh noes',
				'nickname'    => 'div strong',
				'password'    => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			) );
		} else {
			$this->assertTrue( current_user_can( 'unfiltered_html' ) );
			$this->verify_user_roundtrip( array(
				'id'          => self::$editor,
				'name'        => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'first_name'  => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'last_name'   => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'url'         => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'description' => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'nickname'    => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'password'    => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			), array(
				'name'        => 'div strong',
				'first_name'  => 'div strong',
				'last_name'   => 'div strong',
				'url'         => 'http://divdiv/div%20strongstrong/strong%20scriptoh%20noes/script',
				'description' => 'div <strong>strong</strong> oh noes',
				'nickname'    => 'div strong',
				'password'    => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			) );
		}
	}

	public function test_user_roundtrip_as_superadmin() {
		wp_set_current_user( self::$superadmin );
		$this->assertTrue( current_user_can( 'unfiltered_html' ) );
		$valid_username = is_multisite() ? 'noinvalidcharshere' : 'no-invalid-chars-here';
		$this->verify_user_roundtrip( array(
			'username'    => $valid_username,
			'name'        => '\\\&\\\ &amp; &invalid; < &lt; &amp;lt;',
			'first_name'  => '\\\&\\\ &amp; &invalid; < &lt; &amp;lt;',
			'last_name'   => '\\\&\\\ &amp; &invalid; < &lt; &amp;lt;',
			'url'         => '\\\&\\\ &amp; &invalid; < &lt; &amp;lt;',
			'description' => '\\\&\\\ &amp; &invalid; < &lt; &amp;lt;',
			'nickname'    => '\\\&\\\ &amp; &invalid; < &lt; &amp;lt;',
			'password'    => '& &amp; &invalid; < &lt; &amp;lt;',
		), array(
			'username'    => $valid_username,
			'name'        => '\\\&amp;\\\ &amp; &amp;invalid; &lt; &lt; &amp;lt;',
			'first_name'  => '\\\&amp;\\\ &amp; &amp;invalid; &lt; &lt; &amp;lt;',
			'last_name'   => '\\\&amp;\\\ &amp; &amp;invalid; &lt; &lt; &amp;lt;',
			'url'         => 'http://&amp;%20&amp;%20&amp;invalid;%20%20&lt;%20&amp;lt;',
			'description' => '\\\&amp;\\\ &amp; &amp;invalid; &lt; &lt; &amp;lt;',
			'nickname'    => '\\\&amp;\\\ &amp; &amp;invalid; &lt; &lt; &amp;lt;',
			'password'    => '& &amp; &invalid; < &lt; &amp;lt;',
		) );
	}

	public function test_user_roundtrip_as_superadmin_html() {
		wp_set_current_user( self::$superadmin );
		$this->assertTrue( current_user_can( 'unfiltered_html' ) );
		$valid_username = is_multisite() ? 'noinvalidcharshere' : 'no-invalid-chars-here';
		$this->verify_user_roundtrip( array(
			'username'    => $valid_username,
			'name'        => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			'first_name'  => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			'last_name'   => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			'url'         => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			'description' => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			'nickname'    => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			'password'    => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
		), array(
			'username'    => $valid_username,
			'name'        => 'div strong',
			'first_name'  => 'div strong',
			'last_name'   => 'div strong',
			'url'         => 'http://divdiv/div%20strongstrong/strong%20scriptoh%20noes/script',
			'description' => 'div <strong>strong</strong> oh noes',
			'nickname'    => 'div strong',
			'password'    => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
		) );
	}

	public function test_delete_item() {
		$user_id = $this->factory->user->create( array( 'display_name' => 'Deleted User' ) );

		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$userdata = get_userdata( $user_id ); // cache for later
		$request = new WP_REST_Request( 'DELETE', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request->set_param( 'force', true );
		$request->set_param( 'reassign', false );
		$response = $this->server->dispatch( $request );

		// Not implemented in multisite.
		if ( is_multisite() ) {
			$this->assertErrorResponse( 'rest_cannot_delete', $response, 501 );
			return;
		}

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertTrue( $data['deleted'] );
		$this->assertEquals( 'Deleted User', $data['previous']['name'] );
	}

	public function test_delete_item_no_trash() {
		$user_id = $this->factory->user->create( array( 'display_name' => 'Deleted User' ) );

		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$userdata = get_userdata( $user_id ); // cache for later

		$request = new WP_REST_Request( 'DELETE', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request->set_param( 'reassign', false );
		$response = $this->server->dispatch( $request );

		// Not implemented in multisite.
		if ( is_multisite() ) {
			$this->assertErrorResponse( 'rest_cannot_delete', $response, 501 );
			return;
		}

		$this->assertErrorResponse( 'rest_trash_not_supported', $response, 501 );

		$request->set_param( 'force', 'false' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_trash_not_supported', $response, 501 );

		// Ensure the user still exists
		$user = get_user_by( 'id', $user_id );
		$this->assertNotEmpty( $user );
	}

	public function test_delete_current_item() {
		$user_id = $this->factory->user->create( array( 'role' => 'administrator', 'display_name' => 'Deleted User' ) );

		wp_set_current_user( $user_id );
		$user = wp_get_current_user();
		update_site_option( 'site_admins', array( $user->user_login ) );

		$request = new WP_REST_Request( 'DELETE', '/wp/v2/users/me' );
		$request['force'] = true;
		$request->set_param( 'reassign', false );
		$response = $this->server->dispatch( $request );

		// Not implemented in multisite.
		if ( is_multisite() ) {
			$this->assertErrorResponse( 'rest_cannot_delete', $response, 501 );
			return;
		}

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertTrue( $data['deleted'] );
		$this->assertEquals( 'Deleted User', $data['previous']['name'] );
	}

	public function test_delete_current_item_no_trash() {
		$user_id = $this->factory->user->create( array( 'role' => 'administrator', 'display_name' => 'Deleted User' ) );

		wp_set_current_user( $user_id );
		$user = wp_get_current_user();
		update_site_option( 'site_admins', array( $user->user_login ) );

		$request = new WP_REST_Request( 'DELETE', '/wp/v2/users/me' );
		$request->set_param( 'reassign', false );
		$response = $this->server->dispatch( $request );

		// Not implemented in multisite.
		if ( is_multisite() ) {
			$this->assertErrorResponse( 'rest_cannot_delete', $response, 501 );
			return;
		}

		$this->assertErrorResponse( 'rest_trash_not_supported', $response, 501 );

		$request->set_param( 'force', 'false' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_trash_not_supported', $response, 501 );

		// Ensure the user still exists
		$user = get_user_by( 'id', $user_id );
		$this->assertNotEmpty( $user );
	}

	public function test_delete_user_without_permission() {
		$user_id = $this->factory->user->create();

		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$editor );

		$request = new WP_REST_Request( 'DELETE', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request['force'] = true;
		$request->set_param( 'reassign', false );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_user_cannot_delete', $response, 403 );

		$request = new WP_REST_Request( 'DELETE', '/wp/v2/users/me' );
		$request['force'] = true;
		$request->set_param( 'reassign', false );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_user_cannot_delete', $response, 403 );
	}

	public function test_delete_user_invalid_id() {
		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'DELETE', '/wp/v2/users/100' );
		$request['force'] = true;
		$request->set_param( 'reassign', false );
		$response = $this->server->dispatch( $request );

		// Not implemented in multisite.
		if ( is_multisite() ) {
			$this->assertErrorResponse( 'rest_cannot_delete', $response, 501 );
			return;
		}

		$this->assertErrorResponse( 'rest_user_invalid_id', $response, 404 );
	}

	public function test_delete_user_reassign() {
		$this->allow_user_to_manage_multisite();

		// Test with a new user, to avoid any complications
		$user_id = $this->factory->user->create();
		$reassign_id = $this->factory->user->create();
		$test_post = $this->factory->post->create(array(
			'post_author' => $user_id,
		));

		// Sanity check to ensure the factory created the post correctly
		$post = get_post( $test_post );
		$this->assertEquals( $user_id, $post->post_author );

		// Delete our test user, and reassign to the new author
		wp_set_current_user( self::$user );
		$request = new WP_REST_Request( 'DELETE', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request['force'] = true;
		$request->set_param( 'reassign', $reassign_id );
		$response = $this->server->dispatch( $request );

		// Not implemented in multisite.
		if ( is_multisite() ) {
			$this->assertErrorResponse( 'rest_cannot_delete', $response, 501 );
			return;
		}

		$this->assertEquals( 200, $response->get_status() );

		// Check that the post has been updated correctly
		$post = get_post( $test_post );
		$this->assertEquals( $reassign_id, $post->post_author );
	}

	public function test_delete_user_invalid_reassign_id() {
		$user_id = $this->factory->user->create();

		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'DELETE', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request['force'] = true;
		$request->set_param( 'reassign', 100 );
		$response = $this->server->dispatch( $request );

		// Not implemented in multisite.
		if ( is_multisite() ) {
			$this->assertErrorResponse( 'rest_cannot_delete', $response, 501 );
			return;
		}

		$this->assertErrorResponse( 'rest_user_invalid_reassign', $response, 400 );
	}

	public function test_delete_user_invalid_reassign_passed_as_string() {
		$user_id = $this->factory->user->create();

		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'DELETE', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request['force'] = true;
		$request->set_param( 'reassign', 'null' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_delete_user_reassign_passed_as_boolean_false_trashes_post() {
		$user_id = $this->factory->user->create();

		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$test_post = $this->factory->post->create(array(
			'post_author' => $user_id,
		));

		$request = new WP_REST_Request( 'DELETE', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request['force'] = true;
		$request->set_param( 'reassign', false );
		$response = $this->server->dispatch( $request );

		// Not implemented in multisite.
		if ( is_multisite() ) {
			$this->assertErrorResponse( 'rest_cannot_delete', $response, 501 );
			return;
		}

		$test_post = get_post( $test_post );
		$this->assertEquals( 'trash', $test_post->post_status );
	}

	public function test_delete_user_reassign_passed_as_string_false_trashes_post() {
		$user_id = $this->factory->user->create();

		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$test_post = $this->factory->post->create(array(
			'post_author' => $user_id,
		));

		$request = new WP_REST_Request( 'DELETE', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request['force'] = true;
		$request->set_param( 'reassign', 'false' );
		$response = $this->server->dispatch( $request );

		// Not implemented in multisite.
		if ( is_multisite() ) {
			$this->assertErrorResponse( 'rest_cannot_delete', $response, 501 );
			return;
		}

		$test_post = get_post( $test_post );
		$this->assertEquals( 'trash', $test_post->post_status );
	}

	public function test_delete_user_reassign_passed_as_empty_string_trashes_post() {
		$user_id = $this->factory->user->create();

		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$test_post = $this->factory->post->create(array(
			'post_author' => $user_id,
		));

		$request = new WP_REST_Request( 'DELETE', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request['force'] = true;
		$request->set_param( 'reassign', '' );
		$response = $this->server->dispatch( $request );

		// Not implemented in multisite.
		if ( is_multisite() ) {
			$this->assertErrorResponse( 'rest_cannot_delete', $response, 501 );
			return;
		}

		$test_post = get_post( $test_post );
		$this->assertEquals( 'trash', $test_post->post_status );
	}

	public function test_delete_user_reassign_passed_as_0_reassigns_author() {
		$user_id = $this->factory->user->create();

		$this->allow_user_to_manage_multisite();
		wp_set_current_user( self::$user );

		$test_post = $this->factory->post->create(array(
			'post_author' => $user_id,
		));

		$request = new WP_REST_Request( 'DELETE', sprintf( '/wp/v2/users/%d', $user_id ) );
		$request['force'] = true;
		$request->set_param( 'reassign', 0 );
		$response = $this->server->dispatch( $request );

		// Not implemented in multisite.
		if ( is_multisite() ) {
			$this->assertErrorResponse( 'rest_cannot_delete', $response, 501 );
			return;
		}

		$test_post = get_post( $test_post );
		$this->assertEquals( 0, $test_post->post_author );
	}

	public function test_get_item_schema() {
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/users' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$properties = $data['schema']['properties'];

		$this->assertEquals( 19, count( $properties ) );
		$this->assertArrayHasKey( 'avatar_urls', $properties );
		$this->assertArrayHasKey( 'capabilities', $properties );
		$this->assertArrayHasKey( 'description', $properties );
		$this->assertArrayHasKey( 'email', $properties );
		$this->assertArrayHasKey( 'extra_capabilities', $properties );
		$this->assertArrayHasKey( 'first_name', $properties );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'last_name', $properties );
		$this->assertArrayHasKey( 'link', $properties );
		$this->assertArrayHasKey( 'locale', $properties );
		$this->assertArrayHasKey( 'meta', $properties );
		$this->assertArrayHasKey( 'name', $properties );
		$this->assertArrayHasKey( 'nickname', $properties );
		$this->assertArrayHasKey( 'registered_date', $properties );
		$this->assertArrayHasKey( 'slug', $properties );
		$this->assertArrayHasKey( 'password', $properties );
		$this->assertArrayHasKey( 'url', $properties );
		$this->assertArrayHasKey( 'username', $properties );
		$this->assertArrayHasKey( 'roles', $properties );

	}

	public function test_get_item_schema_show_avatar() {
		update_option( 'show_avatars', false );
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/users' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$properties = $data['schema']['properties'];

		$this->assertArrayNotHasKey( 'avatar_urls', $properties );
	}

	public function test_get_additional_field_registration() {

		$schema = array(
			'type'        => 'integer',
			'description' => 'Some integer of mine',
			'enum'        => array( 1, 2, 3, 4 ),
			'context'     => array( 'embed', 'view', 'edit' ),
		);

		register_rest_field( 'user', 'my_custom_int', array(
			'schema'          => $schema,
			'get_callback'    => array( $this, 'additional_field_get_callback' ),
			'update_callback' => array( $this, 'additional_field_update_callback' ),
		) );

		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/users' );

		$response = $this->server->dispatch( $request );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'my_custom_int', $data['schema']['properties'] );
		$this->assertEquals( $schema, $data['schema']['properties']['my_custom_int'] );

		wp_set_current_user( 1 );
		if ( is_multisite() ) {
			$current_user = wp_get_current_user( 1 );
			update_site_option( 'site_admins', array( $current_user->user_login ) );
		}

		$request = new WP_REST_Request( 'GET', '/wp/v2/users/1' );

		$response = $this->server->dispatch( $request );
		$this->assertArrayHasKey( 'my_custom_int', $response->data );

		$request = new WP_REST_Request( 'POST', '/wp/v2/users/1' );
		$request->set_body_params(array(
			'my_custom_int' => 123,
		));

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 123, get_user_meta( 1, 'my_custom_int', true ) );

		$request = new WP_REST_Request( 'POST', '/wp/v2/users' );
		$request->set_body_params(array(
			'my_custom_int' => 123,
			'email' => 'joe@foobar.com',
			'username' => 'abc123',
			'password' => 'hello',
		));

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 123, $response->data['my_custom_int'] );

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

		register_rest_field( 'user', 'my_custom_int', array(
			'schema'          => $schema,
			'get_callback'    => array( $this, 'additional_field_get_callback' ),
			'update_callback' => array( $this, 'additional_field_update_callback' ),
		) );

		wp_set_current_user( 1 );
		if ( is_multisite() ) {
			$current_user = wp_get_current_user( 1 );
			update_site_option( 'site_admins', array( $current_user->user_login ) );
		}

		// Check for error on update.
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/users/%d', self::$user ) );
		$request->set_body_params( array(
			'my_custom_int' => 'returnError',
		) );

		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );

		global $wp_rest_additional_fields;
		$wp_rest_additional_fields = array();
	}

	public function additional_field_get_callback( $object ) {
		return get_user_meta( $object['id'], 'my_custom_int', true );
	}

	public function additional_field_update_callback( $value, $user ) {
		if ( 'returnError' === $value ) {
			return new WP_Error( 'rest_invalid_param', 'Testing an error.', array( 'status' => 400 ) );
		}
		update_user_meta( $user->ID, 'my_custom_int', $value );
	}

	public function tearDown() {
		parent::tearDown();
	}

	protected function check_user_data( $user, $data, $context, $links ) {
		$this->assertEquals( $user->ID, $data['id'] );
		$this->assertEquals( $user->display_name, $data['name'] );
		$this->assertEquals( $user->user_url, $data['url'] );
		$this->assertEquals( $user->description, $data['description'] );
		$this->assertEquals( get_author_posts_url( $user->ID ), $data['link'] );
		$this->assertArrayHasKey( 'avatar_urls', $data );
		$this->assertEquals( $user->user_nicename, $data['slug'] );

		if ( 'edit' === $context ) {
			$this->assertEquals( $user->first_name, $data['first_name'] );
			$this->assertEquals( $user->last_name, $data['last_name'] );
			$this->assertEquals( $user->nickname, $data['nickname'] );
			$this->assertEquals( $user->user_email, $data['email'] );
			$this->assertEquals( (object) $user->allcaps, $data['capabilities'] );
			$this->assertEquals( (object) $user->caps, $data['extra_capabilities'] );
			$this->assertEquals( date( 'c', strtotime( $user->user_registered ) ), $data['registered_date'] );
			$this->assertEquals( $user->user_login, $data['username'] );
			$this->assertEquals( $user->roles, $data['roles'] );
			$this->assertEquals( get_user_locale( $user ), $data['locale'] );
		}

		if ( 'edit' !== $context ) {
			$this->assertArrayNotHasKey( 'roles', $data );
			$this->assertArrayNotHasKey( 'capabilities', $data );
			$this->assertArrayNotHasKey( 'registered_date', $data );
			$this->assertArrayNotHasKey( 'first_name', $data );
			$this->assertArrayNotHasKey( 'last_name', $data );
			$this->assertArrayNotHasKey( 'nickname', $data );
			$this->assertArrayNotHasKey( 'email', $data );
			$this->assertArrayNotHasKey( 'extra_capabilities', $data );
			$this->assertArrayNotHasKey( 'username', $data );
			$this->assertArrayNotHasKey( 'locale', $data );
		}

		$this->assertEqualSets( array(
			'self',
			'collection',
		), array_keys( $links ) );

		$this->assertArrayNotHasKey( 'password', $data );
	}

	protected function check_get_user_response( $response, $context = 'view' ) {
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$userdata = get_userdata( $data['id'] );
		$this->check_user_data( $userdata, $data, $context, $response->get_links() );
	}

	protected function check_add_edit_user_response( $response, $update = false ) {
		if ( $update ) {
			$this->assertEquals( 200, $response->get_status() );
		} else {
			$this->assertEquals( 201, $response->get_status() );
		}

		$data = $response->get_data();
		$userdata = get_userdata( $data['id'] );
		$this->check_user_data( $userdata, $data, 'edit', $response->get_links() );
	}

	protected function allow_user_to_manage_multisite() {
		wp_set_current_user( self::$user );
		$user = wp_get_current_user();

		if ( is_multisite() ) {
			update_site_option( 'site_admins', array( $user->user_login ) );
		}

		return;
	}
}
