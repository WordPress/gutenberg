<?php

class Gutenberg_REST_Navigation_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * @var int
	 */
	protected static $test_navigation_post_id;

	protected static $test_navigation_post_slug = 'test-navigation-post-slug';

	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
	}

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetupBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		// This creates the global styles for the current theme.
		self::$test_navigation_post_id = wp_insert_post(
			array(
				'post_content' => '',
				'post_status'  => 'publish',
				'post_title'   => __( 'Test Navigation Menu', 'default' ),
				'post_type'    => 'wp_navigation',
				'post_name'    => self::$test_navigation_post_slug,
			),
			true
		);
	}

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey(
			'/wp/v2/navigation/((?P<id>[\d]+)|(?P<slug>[\w\-]+))',
			$routes,
			'Navigation based on (post) ID or slug route does not exist'
		);
	}

	public function test_rest_route_for_post() {
		$route = \rest_get_route_for_post( self::$test_navigation_post_id );

		$this->assertEquals( '/wp/v2/navigation/' . self::$test_navigation_post_slug, $route );
	}

	public function test_context_param() {
		$this->markTestIncomplete();
	}

	public function test_get_items() {
		$this->markTestIncomplete();
	}

	public function test_get_item_by_slug() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/navigation/' . self::$test_navigation_post_slug );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();

		$this->assertEquals(
			self::$test_navigation_post_id,
			$data['id']
		);

		$this->assertEquals(
			'Test Navigation Menu',
			$data['title']['rendered']
		);

		$this->assertEquals(
			'test-navigation-post-slug',
			$data['slug']
		);

		$this->assertEquals(
			'wp_navigation',
			$data['type']
		);
	}

	public function test_get_item_by_id() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/navigation/' . self::$test_navigation_post_id );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();

		$this->assertEquals(
			self::$test_navigation_post_id,
			$data['id']
		);

		$this->assertEquals(
			'Test Navigation Menu',
			$data['title']['rendered']
		);

		$this->assertEquals(
			'test-navigation-post-slug',
			$data['slug']
		);

		$this->assertEquals(
			'wp_navigation',
			$data['type']
		);
	}

	public function test_get_item() {
		$this->markTestIncomplete();
	}

	public function test_create_item() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/navigation' );
		$request->set_body_params(
			array(
				'title'   => 'Freshly created Navigation',
				'slug'    => 'freshly-created-navigation',
				'status'  => 'publish',
				'content' => '',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $response->get_status() );

		$data = $response->get_data();

		$this->assertEquals(
			'Freshly created Navigation',
			$data['title']['rendered']
		);

		$this->assertEquals(
			'freshly-created-navigation',
			$data['slug']
		);

		$this->assertEquals(
			'wp_navigation',
			$data['type']
		);
	}

	public function test_update_item() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/navigation/' . self::$test_navigation_post_slug );
		$request->set_body_params(
			array(
				'title' => 'New Nav title',
				'slug'  => 'the-new-navigation-slug',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals(
			self::$test_navigation_post_id,
			$data['id']
		);

		$this->assertEquals(
			'New Nav title',
			$data['title']['rendered']
		);

		$this->assertEquals(
			'the-new-navigation-slug',
			$data['slug']
		);

		$this->assertEquals(
			'wp_navigation',
			$data['type']
		);
	}

	public function test_delete_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/navigation/' . self::$test_navigation_post_id );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();

		$this->assertEquals(
			self::$test_navigation_post_id,
			$data['id']
		);

		$this->assertEquals(
			'trash',
			$data['status']
		);

		$this->assertEquals(
			'Test Navigation Menu',
			$data['title']['rendered']
		);

		$this->assertEquals(
			'test-navigation-post-slug__trashed',
			$data['slug']
		);
	}

	public function test_permissions_requests_for_item() {
		$this->markTestSkipped( 'Skipped as OPTIONS requests do not contain headers when running phpunit' );
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/navigation/' . self::$test_navigation_post_slug );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$headers = $response->get_headers();

		$this->assertEquals(
			'GET, POST, PUT, PATCH, DELETE',
			$headers['Allow']
		);
	}

	public function test_prepare_item() {
		$this->markTestIncomplete();
	}

	public function test_get_item_schema() {
		$this->markTestIncomplete();
	}
}
