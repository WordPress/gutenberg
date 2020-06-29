<?php

/**
 * Test WP_REST_Block_Directory_Controller_Test()
 *
 * @package Gutenberg
 * phpcs:disable
 */
class WP_REST_Block_Directory_Controller_Test extends WP_Test_REST_Controller_Testcase {
	protected static $admin_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);

		if ( is_multisite() ) {
			grant_super_admin( self::$admin_id );
		}
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/__experimental/block-directory/search', $routes );
	}

	public function test_context_param() {
		// Collection.
		$request  = new WP_REST_Request( 'OPTIONS', '/__experimental/block-directory/search' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	public function test_get_items() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', '/__experimental/block-directory/search' );
		$request->set_query_params( array( 'term' => 'foo' ) );

		$result = rest_do_request( $request );
		$this->assertNotWPError( $result->as_error() );
		$this->assertEquals( 200, $result->status );
	}

	public function test_get_items_wdotorg_unavailable() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', '/__experimental/block-directory/search' );
		$request->set_query_params( array( 'term' => 'foo' ) );

		$this->prevent_requests_to_host( 'api.wordpress.org' );

		$this->expectException( 'PHPUnit_Framework_Error_Warning' );
		$response = rest_do_request( $request );
		$this->assertErrorResponse( 'plugins_api_failed', $response, 500 );
	}

	public function test_get_items_logged_out() {
		$request = new WP_REST_Request( 'GET', '/__experimental/block-directory/search' );
		$request->set_query_params( array( 'term' => 'foo' ) );
		$response = rest_do_request( $request );
		$this->assertErrorResponse( 'rest_block_directory_cannot_view', $response );
	}

	public function test_get_items_no_results() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', '/__experimental/block-directory/search' );
		$request->set_query_params( array( 'term' => '0c4549ee68f24eaaed46a49dc983ecde' ) );
		$response = rest_do_request( $request );
		$data     = $response->get_data();

		// Should produce a 200 status with an empty array.
		$this->assertEquals( 200, $response->status );
		$this->assertEquals( array(), $data );
	}

	public function test_get_item() {
		$this->markTestSkipped( 'Controller does not have get_item route.' );
	}

	public function test_create_item() {
		$this->markTestSkipped( 'Controller does not have create_item route.' );
	}

	public function test_update_item() {
		$this->markTestSkipped( 'Controller does not have update_item route.' );
	}

	public function test_delete_item() {
		$this->markTestSkipped( 'Controller does not have delete_item route.' );
	}

	public function test_prepare_item() {
		wp_set_current_user( self::$admin_id );

		// This will hit the live API. We're searching for `block` which should definitely return at least one result.
		$request = new WP_REST_Request( 'GET', '/__experimental/block-directory/search' );
		$request->set_query_params( array( 'term' => 'block' ) );
		$response = rest_do_request( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->status );
		// At least one result
		$this->assertGreaterThanOrEqual( 1, count( $data ) );
		// Each result should be an object with important attributes set
		foreach ( $data as $plugin ) {
			$this->assertArrayHasKey( 'name', $plugin );
			$this->assertArrayHasKey( 'title', $plugin );
			$this->assertArrayHasKey( 'id', $plugin );
			$this->assertArrayHasKey( 'author_block_rating', $plugin );
			$this->assertArrayHasKey( 'assets', $plugin );
			$this->assertArrayHasKey( 'humanized_updated', $plugin );
		}
	}

	public function test_get_item_schema() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'OPTIONS', '/__experimental/block-directory/search' );
		$request->set_query_params( array( 'term' => 'foo' ) );
		$response = rest_do_request( $request );
		$data     = $response->get_data();

		// Check endpoints
		$this->assertEquals( [ 'GET' ], $data['endpoints'][0]['methods'] );
		$this->assertTrue( $data['endpoints'][0]['args']['term'][ 'required'] );

		$properties = $data['schema']['properties'];

		$this->assertCount( 13, $properties );
		$this->assertArrayHasKey( 'name', $properties );
		$this->assertArrayHasKey( 'title', $properties );
		$this->assertArrayHasKey( 'description', $properties );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'rating', $properties );
		$this->assertArrayHasKey( 'rating_count', $properties );
		$this->assertArrayHasKey( 'active_installs', $properties );
		$this->assertArrayHasKey( 'author_block_rating', $properties );
		$this->assertArrayHasKey( 'author_block_count', $properties );
		$this->assertArrayHasKey( 'author', $properties );
		$this->assertArrayHasKey( 'icon', $properties );
		$this->assertArrayHasKey( 'humanized_updated', $properties );
		$this->assertArrayHasKey( 'assets', $properties );
	}

	/**
	 * Simulate a network failure on outbound http requests to a given hostname.
	 *
	 * @param string $blocked_host The host to block connections to.
	 */
	private function prevent_requests_to_host( $blocked_host = 'api.wordpress.org' ) {
		add_filter(
			'pre_http_request',
			static function ( $return, $args, $url ) use ( $blocked_host ) {
				if ( @parse_url( $url, PHP_URL_HOST ) === $blocked_host ) {
					return new WP_Error( 'plugins_api_failed', "An expected error occurred connecting to $blocked_host because of a unit test", "cURL error 7: Failed to connect to $blocked_host port 80: Connection refused" );

				}

				return $return;
			},
			10,
			3
		);
	}
}
