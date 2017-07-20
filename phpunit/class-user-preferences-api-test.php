<?php
/**
 * User preferences API Tests
 *
 * @package Gutenberg
 */

/**
 * Test Gutenberg_User_Preferences
 */
class User_Preferences_API_Test extends WP_Test_REST_Controller_Testcase {
	protected static $user;
	protected static $editor;
	public static function wpSetUpBeforeClass( $factory ) {
		self::$editor = $factory->user->create( array(
			'role'       => 'editor',
			'user_email' => 'editor@example.com',
		) );
		self::$user = $factory->user->create( array(
			'role'       => 'subscriber',
			'user_email' => 'user@example.com',
		) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$user );
		self::delete_user( self::$editor );
	}

	public function test_register_routes() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/gutenberg/v1/user-preferences', $routes );
		$this->assertCount( 2, $routes['/gutenberg/v1/user-preferences'] );
	}

	public function test_get_item() {
		wp_set_current_user( self::$editor );

		$request = new WP_REST_Request( 'GET', '/gutenberg/v1/user-preferences' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		// Each valid preference should be present.
		foreach ( Gutenberg_User_Preferences::VALID_PREFERENCES as $preference ) {
			$this->assertArrayHasKey( $preference, $response->data );
		}
	}

	public function test_get_item_without_permission() {
		wp_set_current_user( self::$user );

		$request = new WP_REST_Request( 'GET', '/gutenberg/v1/user-preferences' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * Should fail with invalid preferences
	 */
	function test_set_item_with_invalid_preferences() {
		wp_set_current_user( self::$editor );

		$params = array(
			'preferences' => array(
				'bad_pref_name' => 42,
			),
		);

		$request = new WP_REST_Request( 'POST', '/gutenberg/v1/user-preferences' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 'rest_invalid_param', $response->data['code'] );
		$this->assertEquals( 400, $response->get_status() );
	}

	/**
	 * Should set an individual preference
	 */
	function test_update_item() {
		wp_set_current_user( self::$editor );

		$params = array(
			'preferences' => array(
				'block_usage' => array( 'core/text' ),
			),
		);

		$request = new WP_REST_Request( 'POST', '/gutenberg/v1/user-preferences' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		$request = new WP_REST_Request( 'GET', '/gutenberg/v1/user-preferences' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( array( 'core/text' ), $response->data['block_usage'][0] );

	}

	/**
	 * Should set multiple preferences
	 */
	function test_update_item_multiple_preferences() {
		wp_set_current_user( self::$editor );

		$params = array(
			'preferences' => array(
				'block_usage'   => array( 'core/text' ),
				'layout_config' => array(
					'things' => 'awesome',
				),
			),
		);

		$request = new WP_REST_Request( 'POST', '/gutenberg/v1/user-preferences' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( $params );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		$request = new WP_REST_Request( 'GET', '/gutenberg/v1/user-preferences' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( array( 'core/text' ), $response->data['block_usage'][0] );
		$this->assertEquals( array(
			'things' => 'awesome',
		), $response->data['layout_config'][0] );

	}

	/** API does not implement these. */
	public function test_get_items() {}
	public function test_create_item() {}
	public function test_delete_item() {}
	public function test_prepare_item() {}
	public function test_context_param() {}
	public function test_get_item_schema() {}

}
