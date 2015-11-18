<?php
/**
 * Unit tests covering WP_REST_Server functionality.
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi
 */
class Tests_REST_Server extends WP_Test_REST_TestCase {
	public function setUp() {
		parent::setUp();

		/** @var WP_REST_Server $wp_rest_server */
		global $wp_rest_server;
		$this->server = $wp_rest_server = new Spy_REST_Server();

		do_action( 'rest_api_init', $this->server );
	}

	public function test_envelope() {
		$data = array(
			'amount of arbitrary data' => 'alot',
		);
		$status = 987;
		$headers = array(
			'Arbitrary-Header' => 'value',
			'Multiple' => 'maybe, yes',
		);

		$response = new WP_REST_Response( $data, $status );
		$response->header( 'Arbitrary-Header', 'value' );

		// Check header concatenation as well.
		$response->header( 'Multiple', 'maybe' );
		$response->header( 'Multiple', 'yes', false );

		$envelope_response = $this->server->envelope_response( $response, false );

		// The envelope should still be a response, but with defaults.
		$this->assertInstanceOf( 'WP_REST_Response', $envelope_response );
		$this->assertEquals( 200, $envelope_response->get_status() );
		$this->assertEmpty( $envelope_response->get_headers() );
		$this->assertEmpty( $envelope_response->get_links() );

		$enveloped = $envelope_response->get_data();

		$this->assertEquals( $data,    $enveloped['body'] );
		$this->assertEquals( $status,  $enveloped['status'] );
		$this->assertEquals( $headers, $enveloped['headers'] );
	}

	public function test_default_param() {

		register_rest_route( 'test-ns', '/test', array(
			'methods'  => array( 'GET' ),
			'callback' => '__return_null',
			'args'     => array(
				'foo'  => array(
					'default'  => 'bar',
				),
			),
		) );

		$request = new WP_REST_Request( 'GET', '/test-ns/test' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 'bar', $request['foo'] );
	}

	public function test_default_param_is_overridden() {

		register_rest_route( 'test-ns', '/test', array(
			'methods'  => array( 'GET' ),
			'callback' => '__return_null',
			'args'     => array(
				'foo'  => array(
					'default'  => 'bar',
				),
			),
		) );

		$request = new WP_REST_Request( 'GET', '/test-ns/test' );
		$request->set_query_params( array( 'foo' => 123 ) );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( '123', $request['foo'] );
	}

	public function test_optional_param() {
		register_rest_route( 'optional', '/test', array(
			'methods'  => array( 'GET' ),
			'callback' => '__return_null',
			'args'     => array(
				'foo'  => array(),
			),
		) );

		$request = new WP_REST_Request( 'GET', '/optional/test' );
		$request->set_query_params( array() );
		$response = $this->server->dispatch( $request );
		$this->assertInstanceOf( 'WP_REST_Response', $response );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertArrayNotHasKey( 'foo', (array) $request );
	}

	public function test_no_zero_param() {
		register_rest_route( 'no-zero', '/test', array(
			'methods'  => array( 'GET' ),
			'callback' => '__return_null',
			'args'     => array(
				'foo'  => array(
					'default'    => 'bar',
				),
			),
		) );
		$request = new WP_REST_Request( 'GET', '/no-zero/test' );
		$this->server->dispatch( $request );
		$this->assertEquals( array( 'foo' => 'bar' ), $request->get_params() );
	}

	/**
	 * Pass a capability which the user does not have, this should
	 * result in a 403 error.
	 */
	function test_rest_route_capability_authorization_fails() {
		register_rest_route( 'test-ns', '/test', array(
			'methods'      => 'GET',
			'callback'     => '__return_null',
			'should_exist' => false,
			'permission_callback' => array( $this, 'permission_denied' ),
		) );

		$request = new WP_REST_Request( 'GET', '/test-ns/test', array() );
		$result = $this->server->dispatch( $request );

		$this->assertEquals( 403, $result->get_status() );
	}

	/**
	 * An editor should be able to get access to an route with the
	 * edit_posts capability.
	 */
	function test_rest_route_capability_authorization() {
		register_rest_route( 'test-ns', '/test', array(
			'methods'      => 'GET',
			'callback'     => '__return_null',
			'should_exist' => false,
			'permission_callback' => '__return_true',
		) );

		$editor = self::factory()->user->create( array( 'role' => 'editor' ) );

		$request = new WP_REST_Request( 'GET', '/test-ns/test', array() );

		wp_set_current_user( $editor );

		$result = $this->server->dispatch( $request );

		$this->assertEquals( 200, $result->get_status() );
	}

	/**
	 * An "Allow" HTTP header should be sent with a request
	 * for all available methods on that route.
	 */
	function test_allow_header_sent() {

		register_rest_route( 'test-ns', '/test', array(
			'methods'      => 'GET',
			'callback'     => '__return_null',
			'should_exist' => false,
		) );

		$request = new WP_REST_Request( 'GET', '/test-ns/test', array() );

		$result = $this->server->dispatch( $request );
		$result = apply_filters( 'rest_post_dispatch', $result, $this->server, $request );

		$this->assertFalse( $result->get_status() !== 200 );

		$sent_headers = $result->get_headers();
		$this->assertEquals( $sent_headers['Allow'], 'GET' );
	}

	/**
	 * The "Allow" HTTP header should include all available
	 * methods that can be sent to a route.
	 */
	function test_allow_header_sent_with_multiple_methods() {

		register_rest_route( 'test-ns', '/test', array(
			'methods'      => 'GET',
			'callback'     => '__return_null',
			'should_exist' => false,
		) );

		register_rest_route( 'test-ns', '/test', array(
			'methods'      => 'POST',
			'callback'     => '__return_null',
			'should_exist' => false,
		) );

		$request = new WP_REST_Request( 'GET', '/test-ns/test', array() );

		$result = $this->server->dispatch( $request );

		$this->assertFalse( $result->get_status() !== 200 );

		$result = apply_filters( 'rest_post_dispatch', $result, $this->server, $request );

		$sent_headers = $result->get_headers();
		$this->assertEquals( $sent_headers['Allow'], 'GET, POST' );
	}

	/**
	 * The "Allow" HTTP header should NOT include other methods
	 * which the user does not have access to.
	 */
	function test_allow_header_send_only_permitted_methods() {

		register_rest_route( 'test-ns', '/test', array(
			'methods'      => 'GET',
			'callback'     => '__return_null',
			'should_exist' => false,
			'permission_callback' => array( $this, 'permission_denied' ),
		) );

		register_rest_route( 'test-ns', '/test', array(
			'methods'      => 'POST',
			'callback'     => '__return_null',
			'should_exist' => false,
		) );

		$request = new WP_REST_Request( 'GET', '/test-ns/test', array() );

		$result = $this->server->dispatch( $request );
		$result = apply_filters( 'rest_post_dispatch', $result, $this->server, $request );

		$this->assertEquals( $result->get_status(), 403 );

		$sent_headers = $result->get_headers();
		$this->assertEquals( $sent_headers['Allow'], 'POST' );
	}

	public function permission_denied() {
		return new WP_Error( 'forbidden', 'You are not allowed to do this', array( 'status' => 403 ) );
	}

	public function test_error_to_response() {
		$code    = 'wp-api-test-error';
		$message = 'Test error message for the API';
		$error   = new WP_Error( $code, $message );

		$response = $this->server->error_to_response( $error );
		$this->assertInstanceOf( 'WP_REST_Response', $response );

		// Make sure we default to a 500 error.
		$this->assertEquals( 500, $response->get_status() );

		$data = $response->get_data();

		$this->assertEquals( $code,    $data['code'] );
		$this->assertEquals( $message, $data['message'] );
	}

	public function test_error_to_response_with_status() {
		$code    = 'wp-api-test-error';
		$message = 'Test error message for the API';
		$error   = new WP_Error( $code, $message, array( 'status' => 400 ) );

		$response = $this->server->error_to_response( $error );
		$this->assertInstanceOf( 'WP_REST_Response', $response );

		$this->assertEquals( 400, $response->get_status() );

		$data = $response->get_data();

		$this->assertEquals( $code,    $data['code'] );
		$this->assertEquals( $message, $data['message'] );
	}

	public function test_error_to_response_to_error() {
		$code     = 'wp-api-test-error';
		$message  = 'Test error message for the API';
		$code2    = 'wp-api-test-error-2';
		$message2 = 'Another test message';
		$error   = new WP_Error( $code, $message, array( 'status' => 400 ) );
		$error->add( $code2, $message2, array( 'status' => 403 ) );

		$response = $this->server->error_to_response( $error );
		$this->assertInstanceOf( 'WP_REST_Response', $response );

		$this->assertEquals( 400, $response->get_status() );

		$error = $response->as_error();
		$this->assertInstanceOf( 'WP_Error', $error );
		$this->assertEquals( $code, $error->get_error_code() );
		$this->assertEquals( $message, $error->get_error_message() );
		$this->assertEquals( $message2, $error->errors[ $code2 ][0] );
		$this->assertEquals( array( 'status' => 403 ), $error->error_data[ $code2 ] );
	}

	public function test_rest_error() {
		$data = array(
			'code'    => 'wp-api-test-error',
			'message' => 'Message text',
		);
		$expected = wp_json_encode( $data );
		$response = $this->server->json_error( 'wp-api-test-error', 'Message text' );

		$this->assertEquals( $expected, $response );
	}

	public function test_json_error_with_status() {
		$stub = $this->getMockBuilder( 'Spy_REST_Server' )
		             ->setMethods( array( 'set_status' ) )
		             ->getMock();

		$stub->expects( $this->once() )
		     ->method( 'set_status' )
		     ->with( $this->equalTo( 400 ) );

		$data = array(
			'code'    => 'wp-api-test-error',
			'message' => 'Message text',
		);
		$expected = wp_json_encode( $data );

		$response = $stub->json_error( 'wp-api-test-error', 'Message text', 400 );

		$this->assertEquals( $expected, $response );
	}

	public function test_response_to_data_links() {
		$response = new WP_REST_Response();
		$response->add_link( 'self', 'http://example.com/' );
		$response->add_link( 'alternate', 'http://example.org/', array( 'type' => 'application/xml' ) );

		$data = $this->server->response_to_data( $response, false );
		$this->assertArrayHasKey( '_links', $data );

		$self = array(
			'href' => 'http://example.com/',
		);
		$this->assertEquals( $self, $data['_links']['self'][0] );

		$alternate = array(
			'href' => 'http://example.org/',
			'type' => 'application/xml',
		);
		$this->assertEquals( $alternate, $data['_links']['alternate'][0] );
	}

	public function test_link_embedding() {
		// Register our testing route.
		$this->server->register_route( 'test', '/test/embeddable', array(
			'methods' => 'GET',
			'callback' => array( $this, 'embedded_response_callback' ),
		) );
		$response = new WP_REST_Response();

		// External links should be ignored.
		$response->add_link( 'alternate', 'http://not-api.example.com/', array( 'embeddable' => true ) );

		// All others should be embedded.
		$response->add_link( 'alternate', rest_url( '/test/embeddable' ), array( 'embeddable' => true ) );

		$data = $this->server->response_to_data( $response, true );
		$this->assertArrayHasKey( '_embedded', $data );

		$alternate = $data['_embedded']['alternate'];
		$this->assertCount( 2, $alternate );
		$this->assertEmpty( $alternate[0] );

		$this->assertInternalType( 'array', $alternate[1] );
		$this->assertArrayNotHasKey( 'code', $alternate[1] );
		$this->assertTrue( $alternate[1]['hello'] );

		// Ensure the context is set to embed when requesting.
		$this->assertEquals( 'embed', $alternate[1]['parameters']['context'] );
	}

	/**
	 * @depends test_link_embedding
	 */
	public function test_link_embedding_self() {
		// Register our testing route.
		$this->server->register_route( 'test', '/test/embeddable', array(
			'methods' => 'GET',
			'callback' => array( $this, 'embedded_response_callback' ),
		) );
		$response = new WP_REST_Response();

		// 'self' should be ignored.
		$response->add_link( 'self', rest_url( '/test/notembeddable' ), array( 'embeddable' => true ) );

		$data = $this->server->response_to_data( $response, true );

		$this->assertArrayNotHasKey( '_embedded', $data );
	}

	/**
	 * @depends test_link_embedding
	 */
	public function test_link_embedding_params() {
		// Register our testing route.
		$this->server->register_route( 'test', '/test/embeddable', array(
			'methods' => 'GET',
			'callback' => array( $this, 'embedded_response_callback' ),
		) );

		$response = new WP_REST_Response();
		$response->add_link( 'alternate', rest_url( '/test/embeddable?parsed_params=yes' ), array( 'embeddable' => true ) );

		$data = $this->server->response_to_data( $response, true );

		$this->assertArrayHasKey( '_embedded', $data );
		$this->assertArrayHasKey( 'alternate', $data['_embedded'] );
		$data = $data['_embedded']['alternate'][0];

		$this->assertEquals( 'yes', $data['parameters']['parsed_params'] );
	}

	/**
	 * @depends test_link_embedding_params
	 */
	public function test_link_embedding_error() {
		// Register our testing route.
		$this->server->register_route( 'test', '/test/embeddable', array(
			'methods' => 'GET',
			'callback' => array( $this, 'embedded_response_callback' ),
		) );

		$response = new WP_REST_Response();
		$response->add_link( 'up', rest_url( '/test/embeddable?error=1' ), array( 'embeddable' => true ) );

		$data = $this->server->response_to_data( $response, true );

		$this->assertArrayHasKey( '_embedded', $data );
		$this->assertArrayHasKey( 'up', $data['_embedded'] );

		// Check that errors are embedded correctly.
		$up = $data['_embedded']['up'];
		$this->assertCount( 1, $up );

		$up_data = $up[0];
		$this->assertEquals( 'wp-api-test-error', $up_data['code'] );
		$this->assertEquals( 'Test message',      $up_data['message'] );
		$this->assertEquals( 403, $up_data['data']['status'] );
	}

	/**
	 * Ensure embedding is a no-op without links in the data.
	 */
	public function test_link_embedding_without_links() {
		$data = array(
			'untouched' => 'data',
		);
		$result = $this->server->embed_links( $data );

		$this->assertArrayNotHasKey( '_links', $data );
		$this->assertArrayNotHasKey( '_embedded', $data );
		$this->assertEquals( 'data', $data['untouched'] );
	}

	public function embedded_response_callback( $request ) {
		$params = $request->get_params();

		if ( isset( $params['error'] ) ) {
			return new WP_Error( 'wp-api-test-error', 'Test message', array( 'status' => 403 ) );
		}

		$data = array(
			'hello' => true,
			'parameters' => $params,
		);

		return $data;
	}

	public function test_removing_links() {
		$response = new WP_REST_Response();
		$response->add_link( 'self', 'http://example.com/' );
		$response->add_link( 'alternate', 'http://example.org/', array( 'type' => 'application/xml' ) );

		$response->remove_link( 'self' );

		$data = $this->server->response_to_data( $response, false );
		$this->assertArrayHasKey( '_links', $data );

		$this->assertArrayNotHasKey( 'self', $data['_links'] );

		$alternate = array(
			'href' => 'http://example.org/',
			'type' => 'application/xml',
		);
		$this->assertEquals( $alternate, $data['_links']['alternate'][0] );
	}

	public function test_removing_links_for_href() {
		$response = new WP_REST_Response();
		$response->add_link( 'self', 'http://example.com/' );
		$response->add_link( 'self', 'https://example.com/' );

		$response->remove_link( 'self', 'https://example.com/' );

		$data = $this->server->response_to_data( $response, false );
		$this->assertArrayHasKey( '_links', $data );

		$this->assertArrayHasKey( 'self', $data['_links'] );

		$self_not_filtered = array(
			'href' => 'http://example.com/',
		);
		$this->assertEquals( $self_not_filtered, $data['_links']['self'][0] );
	}

	public function test_get_index() {
		$server = new WP_REST_Server();
		$server->register_route( 'test/example', '/test/example/some-route', array(
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => '__return_true',
			),
			array(
				'methods' => WP_REST_Server::DELETABLE,
				'callback' => '__return_true',
			),
		) );

		$request = new WP_REST_Request( 'GET', '/' );
		$index = $server->dispatch( $request );
		$data = $index->get_data();

		$this->assertArrayHasKey( 'name', $data );
		$this->assertArrayHasKey( 'description', $data );
		$this->assertArrayHasKey( 'url', $data );
		$this->assertArrayHasKey( 'namespaces', $data );
		$this->assertArrayHasKey( 'authentication', $data );
		$this->assertArrayHasKey( 'routes', $data );

		// Check namespace data.
		$this->assertContains( 'test/example', $data['namespaces'] );

		// Check the route.
		$this->assertArrayHasKey( '/test/example/some-route', $data['routes'] );
		$route = $data['routes']['/test/example/some-route'];
		$this->assertEquals( 'test/example', $route['namespace'] );
		$this->assertArrayHasKey( 'methods', $route );
		$this->assertContains( 'GET', $route['methods'] );
		$this->assertContains( 'DELETE', $route['methods'] );
		$this->assertArrayHasKey( '_links', $route );
	}

	public function test_get_namespace_index() {
		$server = new WP_REST_Server();
		$server->register_route( 'test/example', '/test/example/some-route', array(
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => '__return_true',
			),
			array(
				'methods' => WP_REST_Server::DELETABLE,
				'callback' => '__return_true',
			),
		) );
		$server->register_route( 'test/another', '/test/another/route', array(
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => '__return_false',
			),
		) );

		$request = new WP_REST_Request();
		$request->set_param( 'namespace', 'test/example' );
		$index = rest_ensure_response( $server->get_namespace_index( $request ) );
		$data = $index->get_data();

		// Check top-level.
		$this->assertEquals( 'test/example', $data['namespace'] );
		$this->assertArrayHasKey( 'routes', $data );

		// Check we have the route we expect...
		$this->assertArrayHasKey( '/test/example/some-route', $data['routes'] );

		// ...and none we don't.
		$this->assertArrayNotHasKey( '/test/another/route', $data['routes'] );
	}

	public function test_get_namespaces() {
		$server = new WP_REST_Server();
		$server->register_route( 'test/example', '/test/example/some-route', array(
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => '__return_true',
			),
		) );
		$server->register_route( 'test/another', '/test/another/route', array(
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => '__return_false',
			),
		) );

		$namespaces = $server->get_namespaces();
		$this->assertContains( 'test/example', $namespaces );
		$this->assertContains( 'test/another', $namespaces );
	}
}
