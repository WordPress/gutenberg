<?php
/**
 * Unit tests covering WP_REST_Controller functionality
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi
 */
class WP_Test_REST_Controller extends WP_Test_REST_TestCase {

	public function setUp() {
		parent::setUp();
		$this->request = new WP_REST_Request( 'GET', '/wp/v2/testroute', array(
			'args'     => array(
				'someinteger'     => array(
					'type'        => 'integer',
				),
				'someboolean'     => array(
					'type'        => 'boolean',
				),
				'somestring'      => array(
					'type'        => 'string',
				),
				'someenum'        => array(
					'type'        => 'string',
					'enum'        => array( 'a' ),
				),
				'somedate'        => array(
					'type'        => 'string',
					'format'      => 'date-time',
				),
				'someemail'       => array(
					'type'        => 'string',
					'format'      => 'email',
				),
			),
		));
	}

	public function test_validate_schema_type_integer() {

		$this->assertTrue(
			rest_validate_request_arg( '123', $this->request, 'someinteger' )
		);

		$this->assertErrorResponse(
			'rest_invalid_param',
			rest_validate_request_arg( 'abc', $this->request, 'someinteger' )
		);
	}

	public function test_validate_schema_type_boolean() {

		$this->assertTrue(
			rest_validate_request_arg( true, $this->request, 'someboolean' )
		);
		$this->assertTrue(
			rest_validate_request_arg( false, $this->request, 'someboolean' )
		);

		$this->assertTrue(
			rest_validate_request_arg( 'true', $this->request, 'someboolean' )
		);
		$this->assertTrue(
			rest_validate_request_arg( 'TRUE', $this->request, 'someboolean' )
		);
		$this->assertTrue(
			rest_validate_request_arg( 'false', $this->request, 'someboolean' )
		);
		$this->assertTrue(
			rest_validate_request_arg( 'False', $this->request, 'someboolean' )
		);
		$this->assertTrue(
			rest_validate_request_arg( '1', $this->request, 'someboolean' )
		);
		$this->assertTrue(
			rest_validate_request_arg( '0', $this->request, 'someboolean' )
		);
		$this->assertTrue(
			rest_validate_request_arg( 1, $this->request, 'someboolean' )
		);
		$this->assertTrue(
			rest_validate_request_arg( 0, $this->request, 'someboolean' )
		);

		// Check sanitize testing.
		$this->assertEquals( false,
			rest_sanitize_request_arg( 'false', $this->request, 'someboolean' )
		);
		$this->assertEquals( false,
			rest_sanitize_request_arg( '0', $this->request, 'someboolean' )
		);
		$this->assertEquals( false,
			rest_sanitize_request_arg( 0, $this->request, 'someboolean' )
		);
		$this->assertEquals( false,
			rest_sanitize_request_arg( 'FALSE', $this->request, 'someboolean' )
		);
		$this->assertEquals( true,
			rest_sanitize_request_arg( 'true', $this->request, 'someboolean' )
		);
		$this->assertEquals( true,
			rest_sanitize_request_arg( '1', $this->request, 'someboolean' )
		);
		$this->assertEquals( true,
			rest_sanitize_request_arg( 1, $this->request, 'someboolean' )
		);
		$this->assertEquals( true,
			rest_sanitize_request_arg( 'TRUE', $this->request, 'someboolean' )
		);

		$this->assertErrorResponse(
			'rest_invalid_param',
			rest_validate_request_arg( '123', $this->request, 'someboolean' )
		);
	}

	public function test_validate_schema_type_string() {

		$this->assertTrue(
			rest_validate_request_arg( '123', $this->request, 'somestring' )
		);

		$this->assertErrorResponse(
			'rest_invalid_param',
			rest_validate_request_arg( array( 'foo' => 'bar' ), $this->request, 'somestring' )
		);
	}

	public function test_validate_schema_enum() {

		$this->assertTrue(
			rest_validate_request_arg( 'a', $this->request, 'someenum' )
		);

		$this->assertErrorResponse(
			'rest_invalid_param',
			rest_validate_request_arg( 'd', $this->request, 'someenum' )
		);
	}

	public function test_validate_schema_format_email() {

		$this->assertTrue(
			rest_validate_request_arg( 'joe@foo.bar', $this->request, 'someemail' )
		);

		$this->assertErrorResponse(
			'rest_invalid_email',
			rest_validate_request_arg( 'd', $this->request, 'someemail' )
		);
	}

	public function test_validate_schema_format_date_time() {

		$this->assertTrue(
			rest_validate_request_arg( '2010-01-01T12:00:00', $this->request, 'somedate' )
		);

		$this->assertErrorResponse(
			'rest_invalid_date',
			rest_validate_request_arg( '2010-18-18T12:00:00', $this->request, 'somedate' )
		);
	}

	public function test_get_endpoint_args_for_item_schema_description() {
		$controller = new WP_REST_Test_Controller();
		$args       = $controller->get_endpoint_args_for_item_schema();
		$this->assertEquals( 'A pretty string.', $args['somestring']['description'] );
		$this->assertFalse( isset( $args['someinteger']['description'] ) );
	}

	public function test_get_endpoint_args_for_item_schema_arg_options() {

		$controller = new WP_REST_Test_Controller();
		$args       = $controller->get_endpoint_args_for_item_schema();

		$this->assertFalse( $args['someargoptions']['required'] );
		$this->assertEquals( '__return_true', $args['someargoptions']['sanitize_callback'] );
	}

	public function test_get_endpoint_args_for_item_schema_default_value() {

		$controller = new WP_REST_Test_Controller();

		$args = $controller->get_endpoint_args_for_item_schema();

		$this->assertEquals( 'a', $args['somedefault']['default'] );
	}
}
