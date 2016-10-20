<?php

class WP_Test_REST_Request_Validation extends WP_Test_REST_TestCase {

	public function test_validate_within_min_max_range_inclusive() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/foo', array(
			'args' => array(
				'minmaxrange' => array(
					'type'    => 'integer',
					'minimum' => 2,
					'maximum' => 10,
				),
			),
		) );
		$ret = rest_validate_request_arg( 1, $request, 'minmaxrange' );
		$this->assertEquals( 'minmaxrange must be between 2 (inclusive) and 10 (inclusive)', $ret->get_error_message() );
		$ret = rest_validate_request_arg( 2, $request, 'minmaxrange' );
		$this->assertTrue( $ret );
		$ret = rest_validate_request_arg( 10, $request, 'minmaxrange' );
		$this->assertTrue( $ret );
		$ret = rest_validate_request_arg( 11, $request, 'minmaxrange' );
		$this->assertEquals( 'minmaxrange must be between 2 (inclusive) and 10 (inclusive)', $ret->get_error_message() );
	}

	public function test_validate_within_min_max_range_min_exclusive() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/foo', array(
			'args' => array(
				'minmaxrange' => array(
					'type'             => 'integer',
					'minimum'          => 2,
					'maximum'          => 10,
					'exclusiveMinimum' => true,
				),
			),
		) );
		$ret = rest_validate_request_arg( 1, $request, 'minmaxrange' );
		$this->assertEquals( 'minmaxrange must be between 2 (exclusive) and 10 (inclusive)', $ret->get_error_message() );
		$ret = rest_validate_request_arg( 2, $request, 'minmaxrange' );
		$this->assertEquals( 'minmaxrange must be between 2 (exclusive) and 10 (inclusive)', $ret->get_error_message() );
		$ret = rest_validate_request_arg( 3, $request, 'minmaxrange' );
		$this->assertTrue( $ret );
		$ret = rest_validate_request_arg( 9, $request, 'minmaxrange' );
		$this->assertTrue( $ret );
		$ret = rest_validate_request_arg( 10, $request, 'minmaxrange' );
		$this->assertTrue( $ret );
		$ret = rest_validate_request_arg( 11, $request, 'minmaxrange' );
		$this->assertEquals( 'minmaxrange must be between 2 (exclusive) and 10 (inclusive)', $ret->get_error_message() );
	}

	public function test_validate_within_min_max_range_max_exclusive() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/foo', array(
			'args' => array(
				'minmaxrange' => array(
					'type'             => 'integer',
					'minimum'          => 2,
					'maximum'          => 10,
					'exclusiveMaximum' => true,
				),
			),
		) );
		$ret = rest_validate_request_arg( 1, $request, 'minmaxrange' );
		$this->assertEquals( 'minmaxrange must be between 2 (inclusive) and 10 (exclusive)', $ret->get_error_message() );
		$ret = rest_validate_request_arg( 2, $request, 'minmaxrange' );
		$this->assertTrue( $ret );
		$ret = rest_validate_request_arg( 3, $request, 'minmaxrange' );
		$this->assertTrue( $ret );
		$ret = rest_validate_request_arg( 9, $request, 'minmaxrange' );
		$this->assertTrue( $ret );
		$ret = rest_validate_request_arg( 10, $request, 'minmaxrange' );
		$this->assertEquals( 'minmaxrange must be between 2 (inclusive) and 10 (exclusive)', $ret->get_error_message() );
		$ret = rest_validate_request_arg( 11, $request, 'minmaxrange' );
		$this->assertEquals( 'minmaxrange must be between 2 (inclusive) and 10 (exclusive)', $ret->get_error_message() );
	}

	public function test_validate_within_min_max_range_both_exclusive() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/foo', array(
			'args' => array(
				'minmaxrange' => array(
					'type'             => 'integer',
					'minimum'          => 2,
					'maximum'          => 10,
					'exclusiveMinimum' => true,
					'exclusiveMaximum' => true,
				),
			),
		) );
		$ret = rest_validate_request_arg( 1, $request, 'minmaxrange' );
		$this->assertEquals( 'minmaxrange must be between 2 (exclusive) and 10 (exclusive)', $ret->get_error_message() );
		$ret = rest_validate_request_arg( 2, $request, 'minmaxrange' );
		$this->assertEquals( 'minmaxrange must be between 2 (exclusive) and 10 (exclusive)', $ret->get_error_message() );
		$ret = rest_validate_request_arg( 3, $request, 'minmaxrange' );
		$this->assertTrue( $ret );
		$ret = rest_validate_request_arg( 9, $request, 'minmaxrange' );
		$this->assertTrue( $ret );
		$ret = rest_validate_request_arg( 10, $request, 'minmaxrange' );
		$this->assertEquals( 'minmaxrange must be between 2 (exclusive) and 10 (exclusive)', $ret->get_error_message() );
		$ret = rest_validate_request_arg( 11, $request, 'minmaxrange' );
		$this->assertEquals( 'minmaxrange must be between 2 (exclusive) and 10 (exclusive)', $ret->get_error_message() );
	}

	public function test_validate_greater_than_min_inclusive() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/foo', array(
			'args' => array(
				'greaterthanmin' => array(
					'type'             => 'integer',
					'minimum'          => 2,
				),
			),
		) );
		$ret = rest_validate_request_arg( 1, $request, 'greaterthanmin' );
		$this->assertEquals( 'greaterthanmin must be greater than 2 (inclusive)', $ret->get_error_message() );
		$ret = rest_validate_request_arg( 2, $request, 'greaterthanmin' );
		$this->assertTrue( $ret );
	}

	public function test_validate_greater_than_min_exclusive() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/foo', array(
			'args' => array(
				'greaterthanmin' => array(
					'type'             => 'integer',
					'minimum'          => 2,
					'exclusiveMinimum' => true,
				),
			),
		) );
		$ret = rest_validate_request_arg( 1, $request, 'greaterthanmin' );
		$this->assertEquals( 'greaterthanmin must be greater than 2 (exclusive)', $ret->get_error_message() );
		$ret = rest_validate_request_arg( 2, $request, 'greaterthanmin' );
		$this->assertEquals( 'greaterthanmin must be greater than 2 (exclusive)', $ret->get_error_message() );
		$ret = rest_validate_request_arg( 3, $request, 'greaterthanmin' );
		$this->assertTrue( $ret );
	}

	public function test_validate_less_than_max_inclusive() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/foo', array(
			'args' => array(
				'lessthanmax' => array(
					'type'             => 'integer',
					'maximum'          => 10,
				),
			),
		) );
		$ret = rest_validate_request_arg( 11, $request, 'lessthanmax' );
		$this->assertEquals( 'lessthanmax must be less than 10 (inclusive)', $ret->get_error_message() );
		$ret = rest_validate_request_arg( 10, $request, 'lessthanmax' );
		$this->assertTrue( $ret );
	}

	public function test_validate_less_than_max_exclusive() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/foo', array(
			'args' => array(
				'lessthanmax' => array(
					'type'             => 'integer',
					'maximum'          => 10,
					'exclusiveMaximum' => true,
				),
			),
		) );
		$ret = rest_validate_request_arg( 11, $request, 'lessthanmax' );
		$this->assertEquals( 'lessthanmax must be less than 10 (exclusive)', $ret->get_error_message() );
		$ret = rest_validate_request_arg( 10, $request, 'lessthanmax' );
		$this->assertEquals( 'lessthanmax must be less than 10 (exclusive)', $ret->get_error_message() );
		$ret = rest_validate_request_arg( 9, $request, 'lessthanmax' );
		$this->assertTrue( $ret );
	}

}
