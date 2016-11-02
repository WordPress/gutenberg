<?php
/**
 * Unit tests covering WP_REST_Request functionality.
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi
 */
class Tests_REST_Request extends WP_UnitTestCase {
	public function setUp() {
		parent::setUp();

		$this->request = new WP_REST_Request();
	}

	public function test_header() {
		$value = 'application/x-wp-example';

		$this->request->set_header( 'Content-Type', $value );

		$this->assertEquals( $value, $this->request->get_header( 'Content-Type' ) );
	}

	public function test_header_missing() {
		$this->assertNull( $this->request->get_header( 'missing' ) );
		$this->assertNull( $this->request->get_header_as_array( 'missing' ) );
	}

	public function test_header_multiple() {
		$value1 = 'application/x-wp-example-1';
		$value2 = 'application/x-wp-example-2';
		$this->request->add_header( 'Accept', $value1 );
		$this->request->add_header( 'Accept', $value2 );

		$this->assertEquals( $value1 . ',' . $value2, $this->request->get_header( 'Accept' ) );
		$this->assertEquals( array( $value1, $value2 ), $this->request->get_header_as_array( 'Accept' ) );
	}

	public static function header_provider() {
		return array(
			array( 'Test', 'test' ),
			array( 'TEST', 'test' ),
			array( 'Test-Header', 'test_header' ),
			array( 'test-header', 'test_header' ),
			array( 'Test_Header', 'test_header' ),
			array( 'test_header', 'test_header' ),
		);
	}

	/**
	 * @dataProvider header_provider
	 * @param string $original Original header key.
	 * @param string $expected Expected canonicalized version.
	 */
	public function test_header_canonicalization( $original, $expected ) {
		$this->assertEquals( $expected, $this->request->canonicalize_header_name( $original ) );
	}

	public static function content_type_provider() {
		return array(
			// Check basic parsing.
			array( 'application/x-wp-example', 'application/x-wp-example', 'application', 'x-wp-example', '' ),
			array( 'application/x-wp-example; charset=utf-8', 'application/x-wp-example', 'application', 'x-wp-example', 'charset=utf-8' ),

			// Check case insensitivity.
			array( 'APPLICATION/x-WP-Example', 'application/x-wp-example', 'application', 'x-wp-example', '' ),
		);
	}

	/**
	 * @dataProvider content_type_provider
	 *
	 * @param string $header Header value.
	 * @param string $value Full type value.
	 * @param string $type Main type (application, text, etc).
	 * @param string $subtype Subtype (json, etc).
	 * @param string $parameters Parameters (charset=utf-8, etc).
	 */
	public function test_content_type_parsing( $header, $value, $type, $subtype, $parameters ) {
		// Check we start with nothing.
		$this->assertEmpty( $this->request->get_content_type() );

		$this->request->set_header( 'Content-Type', $header );
		$parsed = $this->request->get_content_type();

		$this->assertEquals( $value,      $parsed['value'] );
		$this->assertEquals( $type,       $parsed['type'] );
		$this->assertEquals( $subtype,    $parsed['subtype'] );
		$this->assertEquals( $parameters, $parsed['parameters'] );
	}

	protected function request_with_parameters() {
		$this->request->set_url_params( array(
			'source'         => 'url',
			'has_url_params' => true,
		) );
		$this->request->set_query_params( array(
			'source'           => 'query',
			'has_query_params' => true,
		) );
		$this->request->set_body_params( array(
			'source'          => 'body',
			'has_body_params' => true,
		) );

		$json_data = wp_json_encode( array(
			'source'          => 'json',
			'has_json_params' => true,
		) );
		$this->request->set_body( $json_data );

		$this->request->set_default_params( array(
			'source'             => 'defaults',
			'has_default_params' => true,
		) );
	}

	public function test_parameter_order() {
		$this->request_with_parameters();

		$this->request->set_method( 'GET' );

		// Check that query takes precedence.
		$this->assertEquals( 'query', $this->request->get_param( 'source' ) );

		// Check that the correct arguments are parsed (and that falling through
		// the stack works).
		$this->assertTrue( $this->request->get_param( 'has_url_params' ) );
		$this->assertTrue( $this->request->get_param( 'has_query_params' ) );
		$this->assertTrue( $this->request->get_param( 'has_default_params' ) );

		// POST and JSON parameters shouldn't be parsed.
		$this->assertEmpty( $this->request->get_param( 'has_body_params' ) );
		$this->assertEmpty( $this->request->get_param( 'has_json_params' ) );
	}

	public function test_parameter_order_post() {
		$this->request_with_parameters();

		$this->request->set_method( 'POST' );
		$this->request->set_header( 'Content-Type', 'application/x-www-form-urlencoded' );
		$this->request->set_attributes( array( 'accept_json' => true ) );

		// Check that POST takes precedence.
		$this->assertEquals( 'body', $this->request->get_param( 'source' ) );

		// Check that the correct arguments are parsed (and that falling through
		// the stack works).
		$this->assertTrue( $this->request->get_param( 'has_url_params' ) );
		$this->assertTrue( $this->request->get_param( 'has_query_params' ) );
		$this->assertTrue( $this->request->get_param( 'has_body_params' ) );
		$this->assertTrue( $this->request->get_param( 'has_default_params' ) );

		// JSON shouldn't be parsed.
		$this->assertEmpty( $this->request->get_param( 'has_json_params' ) );
	}

	public function test_parameter_order_json() {
		$this->request_with_parameters();

		$this->request->set_method( 'POST' );
		$this->request->set_header( 'Content-Type', 'application/json' );
		$this->request->set_attributes( array( 'accept_json' => true ) );

		// Check that JSON takes precedence.
		$this->assertEquals( 'json', $this->request->get_param( 'source' ) );

		// Check that the correct arguments are parsed (and that falling through
		// the stack works).
		$this->assertTrue( $this->request->get_param( 'has_url_params' ) );
		$this->assertTrue( $this->request->get_param( 'has_query_params' ) );
		$this->assertTrue( $this->request->get_param( 'has_body_params' ) );
		$this->assertTrue( $this->request->get_param( 'has_json_params' ) );
		$this->assertTrue( $this->request->get_param( 'has_default_params' ) );
	}

	public function test_parameter_order_json_invalid() {
		$this->request_with_parameters();

		$this->request->set_method( 'POST' );
		$this->request->set_header( 'Content-Type', 'application/json' );
		$this->request->set_attributes( array( 'accept_json' => true ) );

		// Use invalid JSON data.
		$this->request->set_body( '{ this is not json }' );

		// Check that JSON is ignored.
		$this->assertEquals( 'body', $this->request->get_param( 'source' ) );

		// Check that the correct arguments are parsed (and that falling through
		// the stack works).
		$this->assertTrue( $this->request->get_param( 'has_url_params' ) );
		$this->assertTrue( $this->request->get_param( 'has_query_params' ) );
		$this->assertTrue( $this->request->get_param( 'has_body_params' ) );
		$this->assertTrue( $this->request->get_param( 'has_default_params' ) );

		// JSON should be ignored.
		$this->assertEmpty( $this->request->get_param( 'has_json_params' ) );
	}

	/**
	 * PUT requests don't get $_POST automatically parsed, so ensure that
	 * WP_REST_Request does it for us.
	 */
	public function test_parameters_for_put() {
		$data = array(
			'foo' => 'bar',
			'alot' => array(
				'of' => 'parameters',
			),
			'list' => array(
				'of',
				'cool',
				'stuff',
			),
		);

		$this->request->set_method( 'PUT' );
		$this->request->set_body_params( array() );
		$this->request->set_body( http_build_query( $data ) );

		foreach ( $data as $key => $expected_value ) {
			$this->assertEquals( $expected_value, $this->request->get_param( $key ) );
		}
	}

	public function test_parameters_for_json_put() {
		$data = array(
			'foo' => 'bar',
			'alot' => array(
				'of' => 'parameters',
			),
			'list' => array(
				'of',
				'cool',
				'stuff',
			),
		);

		$this->request->set_method( 'PUT' );
		$this->request->add_header( 'content-type', 'application/json' );
		$this->request->set_body( wp_json_encode( $data ) );

		foreach ( $data as $key => $expected_value ) {
			$this->assertEquals( $expected_value, $this->request->get_param( $key ) );
		}
	}

	public function test_parameters_for_json_post() {
		$data = array(
			'foo' => 'bar',
			'alot' => array(
				'of' => 'parameters',
			),
			'list' => array(
				'of',
				'cool',
				'stuff',
			),
		);

		$this->request->set_method( 'POST' );
		$this->request->add_header( 'content-type', 'application/json' );
		$this->request->set_body( wp_json_encode( $data ) );

		foreach ( $data as $key => $expected_value ) {
			$this->assertEquals( $expected_value, $this->request->get_param( $key ) );
		}
	}

	public function test_parameter_merging() {
		$this->request_with_parameters();

		$this->request->set_method( 'POST' );

		$expected = array(
			'source'             => 'body',
			'has_url_params'     => true,
			'has_query_params'   => true,
			'has_body_params'    => true,
			'has_default_params' => true,
		);
		$this->assertEquals( $expected, $this->request->get_params() );
	}

	public function test_parameter_merging_with_numeric_keys() {
		$this->request->set_query_params( array(
			'1'           => 'hello',
			'2'           => 'goodbye',
		) );
		$expected = array(
			'1'           => 'hello',
			'2'           => 'goodbye',
		);
		$this->assertEquals( $expected, $this->request->get_params() );
	}

	public function test_sanitize_params() {
		$this->request->set_url_params( array(
			'someinteger' => '123',
			'somestring'  => 'hello',
		));

		$this->request->set_attributes( array(
			'args' => array(
				'someinteger' => array(
					'sanitize_callback' => 'absint',
				),
				'somestring'  => array(
					'sanitize_callback' => 'absint',
				),
			),
		) );

		$this->request->sanitize_params();

		$this->assertEquals( 123, $this->request->get_param( 'someinteger' ) );
		$this->assertEquals( 0, $this->request->get_param( 'somestring' ) );
	}

	public function test_sanitize_params_error() {
		$this->request->set_url_params( array(
			'successparam' => '123',
			'failparam'    => '123',
		));
		$this->request->set_attributes( array(
			'args' => array(
				'successparam' => array(
					'sanitize_callback' => 'absint',
				),
				'failparam' => array(
					'sanitize_callback' => array( $this, '_return_wp_error_on_validate_callback' ),
				),
			),
		));

		$valid = $this->request->sanitize_params();
		$this->assertWPError( $valid );
		$this->assertEquals( 'rest_invalid_param', $valid->get_error_code() );
	}

	public function test_has_valid_params_required_flag() {
		$this->request->set_attributes( array(
			'args' => array(
				'someinteger' => array(
					'required' => true,
				),
			),
		) );

		$valid = $this->request->has_valid_params();

		$this->assertWPError( $valid );
		$this->assertEquals( 'rest_missing_callback_param', $valid->get_error_code() );
	}

	public function test_has_valid_params_required_flag_multiple() {
		$this->request->set_attributes( array(
			'args' => array(
				'someinteger' => array(
					'required' => true,
				),
				'someotherinteger' => array(
					'required' => true,
				),
			),
		));

		$valid = $this->request->has_valid_params();

		$this->assertWPError( $valid );
		$this->assertEquals( 'rest_missing_callback_param', $valid->get_error_code() );

		$data = $valid->get_error_data( 'rest_missing_callback_param' );

		$this->assertTrue( in_array( 'someinteger', $data['params'] ) );
		$this->assertTrue( in_array( 'someotherinteger', $data['params'] ) );
	}

	public function test_has_valid_params_validate_callback() {
		$this->request->set_url_params( array(
			'someinteger' => '123',
		));

		$this->request->set_attributes( array(
			'args' => array(
				'someinteger' => array(
					'validate_callback' => '__return_false',
				),
			),
		));

		$valid = $this->request->has_valid_params();

		$this->assertWPError( $valid );
		$this->assertEquals( 'rest_invalid_param', $valid->get_error_code() );
	}

	public function test_has_multiple_invalid_params_validate_callback() {
		$this->request->set_url_params( array(
			'someinteger' => '123',
			'someotherinteger' => '123',
		));

		$this->request->set_attributes( array(
			'args' => array(
				'someinteger' => array(
					'validate_callback' => '__return_false',
				),
				'someotherinteger' => array(
					'validate_callback' => '__return_false',
				),
			),
		));

		$valid = $this->request->has_valid_params();

		$this->assertWPError( $valid );
		$this->assertEquals( 'rest_invalid_param', $valid->get_error_code() );

		$data = $valid->get_error_data( 'rest_invalid_param' );

		$this->assertArrayHasKey( 'someinteger', $data['params'] );
		$this->assertArrayHasKey( 'someotherinteger', $data['params'] );
	}

	public function test_invalid_params_error_response_format() {
		$this->request->set_url_params( array(
			'someinteger' => '123',
			'someotherparams' => '123',
		));

		$this->request->set_attributes( array(
			'args' => array(
				'someinteger' => array(
					'validate_callback' => '__return_false',
				),
				'someotherparams' => array(
					'validate_callback' => array( $this, '_return_wp_error_on_validate_callback' ),
				),
			),
		));

		$valid = $this->request->has_valid_params();
		$this->assertWPError( $valid );
		$error_data = $valid->get_error_data();

		$this->assertEquals( array( 'someinteger', 'someotherparams' ), array_keys( $error_data['params'] ) );
		$this->assertEquals( 'This is not valid!', $error_data['params']['someotherparams'] );
	}

	public function _return_wp_error_on_validate_callback() {
		return new WP_Error( 'some-error', 'This is not valid!' );
	}

	public function data_from_url() {
		return array(
			array(
				'permalink_structure' => '/%post_name%/',
				'original_url'        => 'http://' . WP_TESTS_DOMAIN . '/wp-json/wp/v2/posts/1?foo=bar',
			),
			array(
				'permalink_structure' => '',
				'original_url'        => 'http://' . WP_TESTS_DOMAIN . '/?rest_route=%2Fwp%2Fv2%2Fposts%2F1&foo=bar',
			),
		);
	}

	/**
	 * @dataProvider data_from_url
	 */
	public function test_from_url( $permalink_structure, $original_url ) {
		update_option( 'permalink_structure', $permalink_structure );
		$url = add_query_arg( 'foo', 'bar', rest_url( '/wp/v2/posts/1' ) );
		$this->assertEquals( $original_url, $url );
		$request = WP_REST_Request::from_url( $url );
		$this->assertInstanceOf( 'WP_REST_Request', $request );
		$this->assertEquals( '/wp/v2/posts/1', $request->get_route() );
		$this->assertEqualSets( array(
			'foo' => 'bar',
		), $request->get_query_params() );
	}

	/**
	 * @dataProvider data_from_url
	 */
	public function test_from_url_invalid( $permalink_structure ) {
		update_option( 'permalink_structure', $permalink_structure );
		$using_site = site_url( '/wp/v2/posts/1' );
		$request = WP_REST_Request::from_url( $using_site );
		$this->assertFalse( $request );

		$using_home = home_url( '/wp/v2/posts/1' ) ;
		$request = WP_REST_Request::from_url( $using_home );
		$this->assertFalse( $request );
	}
}
