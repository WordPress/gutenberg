<?php

/**
 * Test WP_REST_Block_Directory_Controller_Test()
 *
 * @package Gutenberg
 * phpcs:disable
 */
class WP_REST_Block_Directory_Controller_Test extends WP_Test_REST_TestCase {
	protected static $admin_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);

		// Ensure routes are registered regardless of the `gutenberg-block-directory` experimental setting.
		// This should be removed when `gutenberg_register_rest_block_directory()` is unconditional.
		add_filter( 'rest_api_init', function () {
			$block_directory_controller = new WP_REST_Block_Directory_Controller();
			$block_directory_controller->register_routes();
		} );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/__experimental/block-directory/search', $routes );
		$this->assertArrayHasKey( '/__experimental/block-directory/install', $routes );
		$this->assertArrayHasKey( '/__experimental/block-directory/uninstall', $routes );
	}

	/**
	 * Tests that an error is returned if the block plugin slug is not provided
	 */
	public function test_should_throw_no_slug_error() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/__experimental/block-directory/install', [] );
		$result  = rest_do_request( $request );

		$this->assertErrorResponse( 'rest_missing_callback_param', $result, 400 );
	}

	/**
	 * Tests that the search endpoint does not return an error
	 */
	public function test_simple_search() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', '/__experimental/block-directory/search' );
		$request->set_query_params( array( 'term' => 'foo' ) );

		$result = rest_do_request( $request );
		$this->assertNotWPError( $result );
		$this->assertEquals( 200, $result->status );
	}

	/**
	 * Tests that the search endpoint returns WP_Error when the server is unreachable.
	 */
	public function test_search_unreachable() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', '/__experimental/block-directory/search' );
		$request->set_query_params( array( 'term' => 'foo' ) );

		$this->prevent_requests_to_host( 'api.wordpress.org' );

		$this->expectException( 'PHPUnit_Framework_Error_Warning' );
		$response = rest_do_request( $request );
		$this->assertErrorResponse( 'plugins_api_failed', $response, 500 );
	}

	/**
	 * Should fail with a permission error if requesting user is not logged in.
	 */
	public function test_simple_search_no_perms() {
		$request = new WP_REST_Request( 'GET', '/__experimental/block-directory/search' );
		$request->set_query_params( array( 'term' => 'foo' ) );
		$response = rest_do_request( $request );
		$data     = $response->get_data();

		$this->assertEquals( $data['code'], 'rest_user_cannot_view' );
	}

	/**
	 * Make sure a search with the right permissions returns something.
	 */
	public function test_simple_search_with_perms() {
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

	/**
	 * A search with zero results should return a 200 response.
	 */
	public function test_simple_search_no_results() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', '/__experimental/block-directory/search' );
		$request->set_query_params( array( 'term' => '0c4549ee68f24eaaed46a49dc983ecde' ) );
		$response = rest_do_request( $request );
		$data     = $response->get_data();

		// Should produce a 200 status with an empty array.
		$this->assertEquals( 200, $response->status );
		$this->assertEquals( array(), $data );
	}

	/**
	 * Make sure the search schema is available and correct.
	 */
	public function test_search_schema() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'OPTIONS', '/__experimental/block-directory/search' );
		$request->set_query_params( array( 'term' => 'foo' ) );
		$response = rest_do_request( $request );
		$data     = $response->get_data();

		// Check endpoints
		$this->assertEquals( [ 'GET' ], $data['endpoints'][0]['methods'] );
		$this->assertEquals( [ 'term' => [ 'required' => true ] ], $data['endpoints'][0]['args'] );

		// Check schema
		$this->assertEquals( [
			'description' => __( "The block name, in namespace/block-name format." ),
			'type'        => [ 'string' ],
			'context'     => [ 'view' ],
		], $data['schema']['properties']['name'] );
		// TODO: ..etc..
	}

	public function test_install_item() {
		if ( ! defined( 'FS_METHOD' ) ) {
			define( 'FS_METHOD', 'direct' );
		}

		if ( isset( get_plugins()['hello-dolly/hello.php'] ) ) {
			delete_plugins( array( 'hello-dolly/hello.php' ) );
		}

		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/__experimental/block-directory/install' );
		$request->set_body_params( array( 'slug' => 'hello-dolly' ) );

		$response = rest_do_request( $request );
		$this->skip_on_filesystem_error( $response );
		$this->assertNotWPError( $response->as_error() );
		$this->assertEquals( 201, $response->get_status() );
		$this->assertEquals( 'Hello Dolly', $response->get_data()['name'] );
	}

	/**
	 * Skips the test if the response is an error due to the filesystem being unavailable.
	 *
	 * @since 5.5.0
	 *
	 * @param WP_REST_Response $response The response object to inspect.
	 */
	protected function skip_on_filesystem_error( WP_REST_Response $response ) {
		if ( ! $response->is_error() ) {
			return;
		}

		if ( 'fs_unavailable' === $response->as_error()->get_error_code() ) {
			$this->markTestSkipped( 'Filesystem is unavailable.' );
		}
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
