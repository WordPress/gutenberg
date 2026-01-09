<?php

class WP_Test_REST_Site_Controller extends WP_Test_REST_Controller_TestCase {

	protected static $superadmin_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$superadmin_id = $factory->user->create(
			array(
				'role'       => 'administrator',
				'user_login' => 'superadmin',
			)
		);

		if ( is_multisite() ) {
			update_site_option( 'site_admins', array( 'superadmin' ) );
		}
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$superadmin_id );
	}

	/**
	 *
	 */
	public function setUp() {
		parent::setUp();
		$this->endpoint = new WP_REST_Sites_Controller;
	}

	/**
	 *
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/sites', $routes );
		$this->assertCount( 2, $routes['/wp/v2/sites'] );
		$this->assertArrayHasKey( '/wp/v2/sites/(?P<id>[\d]+)', $routes );
		$this->assertCount( 3, $routes['/wp/v2/sites/(?P<id>[\d]+)'] );
	}

	/**
	 *
	 */
	public function test_context_param() {
		wp_set_current_user( self::$superadmin_id );
		// Collection
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/sites' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
		// Single
		$blog_id  = self::factory()->blog->create();
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/sites/' . $blog_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}


	/**
	 *
	 */
	public function test_get_items() {
		wp_set_current_user( self::$superadmin_id );
		$this->factory->blog->create_many( 6 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/sites' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$sites = $response->get_data();
		$this->assertCount( 7, $sites );
	}


	/**
	 *
	 */
	public function test_get_item() {
	}

	/**
	 *
	 */
	public function test_create_item() {
	}

	/**
	 *
	 */
	public function test_update_item() {
	}

	/**
	 *
	 */
	public function test_delete_item() {
	}

	/**
	 *
	 */
	public function test_prepare_item() {
	}

	/**
	 *
	 */
	public function test_get_item_schema() {
	}

	/**
	 *
	 */
	public function test_invalid_user_input() {
		$this->assertEquals( array(), $this->endpoint->get_user_site_ids( false ) );
		$this->assertEquals( array(), $this->endpoint->get_user_site_ids( 0 ) );
		$this->assertEquals( array(), $this->endpoint->get_user_site_ids( '' ) );
		$this->assertEquals( array(), $this->endpoint->get_user_site_ids( REST_TESTS_IMPOSSIBLY_HIGH_NUMBER ) );
		$this->assertEquals( array(), $this->endpoint->get_user_site_ids( 999 ) );
	}

	/**
	 *
	 */
	public function test_valid_user_input() {

		$blog_ids = self::factory()->blog->create_many( 5 );
		$user_id  = self::factory()->user->create();
		array_unshift( $blog_ids, 1 );
		foreach ( $blog_ids as $blog_id ) {
			add_user_to_blog( $blog_id, $user_id, 'subscriber' );
		}

		$this->assertEquals( $blog_ids, $this->endpoint->get_user_site_ids( $user_id ) );
	}

	/**
	 *
	 */
	public function test_get_items_filter_user() {
		wp_set_current_user( self::$superadmin_id );
		$blog_ids = self::factory()->blog->create_many( 5 );
		$user_id  = self::factory()->user->create();

		foreach ( $blog_ids as $blog_id ) {
			add_user_to_blog( $blog_id, $user_id, 'subscriber' );
		}
		array_unshift( $blog_ids, 1 );
		$request = new WP_REST_Request( 'GET', '/wp/v2/sites' );
		$request->set_param( 'user', (string) $user_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$sites = $response->get_data();
		$this->assertCount( 6, $sites );
		$this->assertEquals( $blog_ids, wp_list_pluck( $sites, 'id' ) );
	}

	/**
	 *
	 */
	public function test_get_items_me_filter_user() {

		$blog_ids = self::factory()->blog->create_many( 5 );
		$user_id  = self::factory()->user->create();
		wp_set_current_user( $user_id );
		foreach ( $blog_ids as $blog_id ) {
			add_user_to_blog( $blog_id, $user_id, 'subscriber' );
		}
		array_unshift( $blog_ids, 1 );
		$request = new WP_REST_Request( 'GET', '/wp/v2/sites' );
		$request->set_param( 'user', 'me' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$sites = $response->get_data();
		$this->assertCount( 6, $sites );
		$this->assertEquals( $blog_ids, wp_list_pluck( $sites, 'id' ) );
	}

	/**
	 *
	 */
	public function test_get_items_filter_user_no_access() {

		$blog_ids = self::factory()->blog->create_many( 5 );
		$user_id  = self::factory()->user->create();
		$user_id2 = self::factory()->user->create();
		wp_set_current_user( $user_id2 );

		foreach ( $blog_ids as $blog_id ) {
			add_user_to_blog( $blog_id, $user_id, 'subscriber' );
		}
		array_unshift( $blog_ids, 1 );
		$request = new WP_REST_Request( 'GET', '/wp/v2/sites' );
		$request->set_param( 'user', (string) $user_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 *
	 */
	public function test_get_items_filter_with_includes_user() {
		wp_set_current_user( self::$superadmin_id );
		$blog_ids = self::factory()->blog->create_many( 5 );
		$user_id  = self::factory()->user->create();

		foreach ( $blog_ids as $blog_id ) {
			add_user_to_blog( $blog_id, $user_id, 'subscriber' );
		}
		$request = new WP_REST_Request( 'GET', '/wp/v2/sites' );
		$request->set_param( 'user', (string) $user_id );
		$request->set_param( 'include', $blog_ids[0] );
		$response = rest_get_server()->dispatch( $request );
		//$this->assertEquals( 200, $response->get_status() );
		$sites = $response->get_data();
		$this->assertCount( 1, $sites );
		$this->assertEquals( array( $blog_ids[0] ), wp_list_pluck( $sites, 'id' ) );
	}

}
