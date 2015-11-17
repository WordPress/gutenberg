<?php
/**
 * REST API functions.
 *
 * @package WordPress
 * @subpackage REST API
 */

require_once ABSPATH . 'wp-admin/includes/admin.php';
require_once ABSPATH . WPINC . '/rest-api.php';

/**
 * @group restapi
 */
class Tests_REST_API extends WP_UnitTestCase {
	public function setUp() {
		// Override the normal server with our spying server.
		$GLOBALS['wp_rest_server'] = new Spy_REST_Server();
		parent::setup();
	}

	/**
	 * The plugin should be installed and activated.
	 */
	function test_rest_api_activated() {
		$this->assertTrue( class_exists( 'WP_REST_Server' ) );
	}

	/**
	 * The rest_api_init hook should have been registered with init, and should
	 * have a default priority of 10.
	 */
	function test_init_action_added() {
		$this->assertEquals( 10, has_action( 'init', 'rest_api_init' ) );
	}

	/**
	 * Check that a single route is canonicalized.
	 *
	 * Ensures that single and multiple routes are handled correctly.
	 */
	public function test_route_canonicalized() {
		register_rest_route( 'test-ns', '/test', array(
			'methods'  => array( 'GET' ),
			'callback' => '__return_null',
		) );

		// Check the route was registered correctly.
		$endpoints = $GLOBALS['wp_rest_server']->get_raw_endpoint_data();
		$this->assertArrayHasKey( '/test-ns/test', $endpoints );

		// Check the route was wrapped in an array.
		$endpoint = $endpoints['/test-ns/test'];
		$this->assertArrayNotHasKey( 'callback', $endpoint );
		$this->assertArrayHasKey( 'namespace', $endpoint );
		$this->assertEquals( 'test-ns', $endpoint['namespace'] );

		// Grab the filtered data.
		$filtered_endpoints = $GLOBALS['wp_rest_server']->get_routes();
		$this->assertArrayHasKey( '/test-ns/test', $filtered_endpoints );
		$endpoint = $filtered_endpoints['/test-ns/test'];
		$this->assertCount( 1, $endpoint );
		$this->assertArrayHasKey( 'callback', $endpoint[0] );
		$this->assertArrayHasKey( 'methods',  $endpoint[0] );
		$this->assertArrayHasKey( 'args',     $endpoint[0] );
	}

	/**
	 * Check that a single route is canonicalized.
	 *
	 * Ensures that single and multiple routes are handled correctly.
	 */
	public function test_route_canonicalized_multiple() {
		register_rest_route( 'test-ns', '/test', array(
			array(
				'methods'  => array( 'GET' ),
				'callback' => '__return_null',
			),
			array(
				'methods'  => array( 'POST' ),
				'callback' => '__return_null',
			),
		) );

		// Check the route was registered correctly.
		$endpoints = $GLOBALS['wp_rest_server']->get_raw_endpoint_data();
		$this->assertArrayHasKey( '/test-ns/test', $endpoints );

		// Check the route was wrapped in an array.
		$endpoint = $endpoints['/test-ns/test'];
		$this->assertArrayNotHasKey( 'callback', $endpoint );
		$this->assertArrayHasKey( 'namespace', $endpoint );
		$this->assertEquals( 'test-ns', $endpoint['namespace'] );

		$filtered_endpoints = $GLOBALS['wp_rest_server']->get_routes();
		$endpoint = $filtered_endpoints['/test-ns/test'];
		$this->assertCount( 2, $endpoint );

		// Check for both methods.
		foreach ( array( 0, 1 ) as $key ) {
			$this->assertArrayHasKey( 'callback', $endpoint[ $key ] );
			$this->assertArrayHasKey( 'methods',  $endpoint[ $key ] );
			$this->assertArrayHasKey( 'args',     $endpoint[ $key ] );
		}
	}

	/**
	 * Check that routes are merged by default.
	 */
	public function test_route_merge() {
		register_rest_route( 'test-ns', '/test', array(
			'methods'  => array( 'GET' ),
			'callback' => '__return_null',
		) );
		register_rest_route( 'test-ns', '/test', array(
			'methods'  => array( 'POST' ),
			'callback' => '__return_null',
		) );

		// Check both routes exist.
		$endpoints = $GLOBALS['wp_rest_server']->get_routes();
		$endpoint = $endpoints['/test-ns/test'];
		$this->assertCount( 2, $endpoint );
	}

	/**
	 * Check that we can override routes.
	 */
	public function test_route_override() {
		register_rest_route( 'test-ns', '/test', array(
			'methods'      => array( 'GET' ),
			'callback'     => '__return_null',
			'should_exist' => false,
		) );
		register_rest_route( 'test-ns', '/test', array(
			'methods'      => array( 'POST' ),
			'callback'     => '__return_null',
			'should_exist' => true,
		), true );

		// Check we only have one route.
		$endpoints = $GLOBALS['wp_rest_server']->get_routes();
		$endpoint = $endpoints['/test-ns/test'];
		$this->assertCount( 1, $endpoint );

		// Check it's the right one.
		$this->assertArrayHasKey( 'should_exist', $endpoint[0] );
		$this->assertTrue( $endpoint[0]['should_exist'] );
	}

	/**
	 * Test that we reject routes without namespaces
	 *
	 * @expectedIncorrectUsage register_rest_route
	 */
	public function test_route_reject_empty_namespace() {
		register_rest_route( '', '/test-empty-namespace', array(
			'methods'      => array( 'POST' ),
			'callback'     => '__return_null',
		), true );
		$endpoints = $GLOBALS['wp_rest_server']->get_routes();
		$this->assertFalse( isset( $endpoints['/test-empty-namespace'] ) );
	}

	/**
	 * Test that we reject empty routes
	 *
	 * @expectedIncorrectUsage register_rest_route
	 */
	public function test_route_reject_empty_route() {
		register_rest_route( '/test-empty-route', '', array(
			'methods'      => array( 'POST' ),
			'callback'     => '__return_null',
		), true );
		$endpoints = $GLOBALS['wp_rest_server']->get_routes();
		$this->assertFalse( isset( $endpoints['/test-empty-route'] ) );
	}

	/**
	 * The rest_route query variable should be registered.
	 */
	function test_rest_route_query_var() {
		rest_api_init();
		$this->assertTrue( in_array( 'rest_route', $GLOBALS['wp']->public_query_vars ) );
	}

	public function test_route_method() {
		register_rest_route( 'test-ns', '/test', array(
			'methods'  => array( 'GET' ),
			'callback' => '__return_null',
		) );

		$routes = $GLOBALS['wp_rest_server']->get_routes();

		$this->assertEquals( $routes['/test-ns/test'][0]['methods'], array( 'GET' => true ) );
	}

	/**
	 * The 'methods' arg should accept a single value as well as array.
	 */
	public function test_route_method_string() {
		register_rest_route( 'test-ns', '/test', array(
			'methods'  => 'GET',
			'callback' => '__return_null',
		) );

		$routes = $GLOBALS['wp_rest_server']->get_routes();

		$this->assertEquals( $routes['/test-ns/test'][0]['methods'], array( 'GET' => true ) );
	}

	/**
	 * The 'methods' arg should accept a single value as well as array.
	 */
	public function test_route_method_array() {
		register_rest_route( 'test-ns', '/test', array(
			'methods'  => array( 'GET', 'POST' ),
			'callback' => '__return_null',
		) );

		$routes = $GLOBALS['wp_rest_server']->get_routes();

		$this->assertEquals( $routes['/test-ns/test'][0]['methods'], array( 'GET' => true, 'POST' => true ) );
	}

	/**
	 * The 'methods' arg should a comma seperated string.
	 */
	public function test_route_method_comma_seperated() {
		register_rest_route( 'test-ns', '/test', array(
			'methods'  => 'GET,POST',
			'callback' => '__return_null',
		) );

		$routes = $GLOBALS['wp_rest_server']->get_routes();

		$this->assertEquals( $routes['/test-ns/test'][0]['methods'], array( 'GET' => true, 'POST' => true ) );
	}

	public function test_options_request() {
		register_rest_route( 'test-ns', '/test', array(
			'methods'  => 'GET,POST',
			'callback' => '__return_null',
		) );

		$request = new WP_REST_Request( 'OPTIONS', '/test-ns/test' );
		$response = rest_handle_options_request( null, $GLOBALS['wp_rest_server'], $request );

		$headers = $response->get_headers();
		$this->assertArrayHasKey( 'Accept', $headers );

		$this->assertEquals( 'GET, POST', $headers['Accept'] );
	}

	/**
	 * Ensure that the OPTIONS handler doesn't kick in for non-OPTIONS requests.
	 */
	public function test_options_request_not_options() {
		register_rest_route( 'test-ns', '/test', array(
			'methods'  => 'GET,POST',
			'callback' => '__return_true',
		) );

		$request = new WP_REST_Request( 'GET', '/test-ns/test' );
		$response = rest_handle_options_request( null, $GLOBALS['wp_rest_server'], $request );

		$this->assertNull( $response );
	}

	/**
	 * The get_rest_url function should return a URL consistently terminated with a "/",
	 * whether the blog is configured with pretty permalink support or not.
	 */
	public function test_rest_url_generation() {
		// In pretty permalinks case, we expect a path of wp-json/ with no query.
		update_option( 'permalink_structure', '/%year%/%monthnum%/%day%/%postname%/' );
		$this->assertEquals( 'http://' . WP_TESTS_DOMAIN . '/wp-json/', get_rest_url() );

		update_option( 'permalink_structure', '' );
		// In non-pretty case, we get a query string to invoke the rest router.
		$this->assertEquals( 'http://' . WP_TESTS_DOMAIN . '/?rest_route=/', get_rest_url() );

	}
	/**
	 * @ticket 34299
	 */
	public function test_rest_url_scheme() {
		if ( isset( $_SERVER['HTTPS'] ) ) {
			$_https = $_SERVER['HTTPS'];
		}
		$_name = $_SERVER['SERVER_NAME'];
		$_SERVER['SERVER_NAME'] = parse_url( home_url(), PHP_URL_HOST );
		$_siteurl = get_option( 'siteurl' );

		set_current_screen( 'edit.php' );
		$this->assertTrue( is_admin() );

		// Test an HTTP URL
		unset( $_SERVER['HTTPS'] );
		$url = get_rest_url();
		$this->assertSame( 'http', parse_url( $url, PHP_URL_SCHEME ) );

		// Test an HTTPS URL
		$_SERVER['HTTPS'] = 'on';
		$url = get_rest_url();
		$this->assertSame( 'https', parse_url( $url, PHP_URL_SCHEME ) );

		// Switch to an admin request on a different domain name
		$_SERVER['SERVER_NAME'] = 'admin.example.org';
		update_option( 'siteurl', 'http://admin.example.org' );
		$this->assertNotEquals( $_SERVER['SERVER_NAME'], parse_url( home_url(), PHP_URL_HOST ) );

		// // Test an HTTP URL
		unset( $_SERVER['HTTPS'] );
		$url = get_rest_url();
		$this->assertSame( 'http', parse_url( $url, PHP_URL_SCHEME ) );

		// // Test an HTTPS URL
		$_SERVER['HTTPS'] = 'on';
		$url = get_rest_url();
		$this->assertSame( 'http', parse_url( $url, PHP_URL_SCHEME ) );

		// Reset
		if ( isset( $_https ) ) {
			$_SERVER['HTTPS'] = $_https;
		} else {
			unset( $_SERVER['HTTPS'] );
		}
		$_SERVER['SERVER_NAME'] = $_name;
		update_option( 'siteurl', $_siteurl );
		set_current_screen( 'front' );

	}

}
