<?php
/**
 * Unit tests covering schema validation and sanitization functionality.
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi
 */
class WP_Test_REST_Schema_Sanitization extends WP_UnitTestCase {

	public function test_type_number() {
		$schema = array(
			'type'    => 'number',
		);
		$this->assertEquals( 1, rest_sanitize_value_from_schema( 1, $schema ) );
		$this->assertEquals( 1.10, rest_sanitize_value_from_schema( '1.10', $schema ) );
		$this->assertEquals( 1, rest_sanitize_value_from_schema( '1abc', $schema ) );
		$this->assertEquals( 0, rest_sanitize_value_from_schema( 'abc', $schema ) );
		$this->assertEquals( 0, rest_sanitize_value_from_schema( array(), $schema ) );
	}

	public function test_type_integer() {
		$schema = array(
			'type' => 'integer',
		);
		$this->assertEquals( 1, rest_sanitize_value_from_schema( 1, $schema ) );
		$this->assertEquals( 1, rest_sanitize_value_from_schema( '1.10', $schema ) );
		$this->assertEquals( 1, rest_sanitize_value_from_schema( '1abc', $schema ) );
		$this->assertEquals( 0, rest_sanitize_value_from_schema( 'abc', $schema ) );
		$this->assertEquals( 0, rest_sanitize_value_from_schema( array(), $schema ) );
	}

	public function test_type_string() {
		$schema = array(
			'type' => 'string',
		);
		$this->assertEquals( 'Hello', rest_sanitize_value_from_schema( 'Hello', $schema ) );
		$this->assertEquals( '1.10', rest_sanitize_value_from_schema( 1.10, $schema ) );
		$this->assertEquals( '1', rest_sanitize_value_from_schema( 1, $schema ) );
	}

	public function test_type_boolean() {
		$schema = array(
			'type' => 'boolean',
		);
		$this->assertEquals( true, rest_sanitize_value_from_schema( '1', $schema ) );
		$this->assertEquals( true, rest_sanitize_value_from_schema( 'true', $schema ) );
		$this->assertEquals( true, rest_sanitize_value_from_schema( '100', $schema ) );
		$this->assertEquals( true, rest_sanitize_value_from_schema( 1, $schema ) );
		$this->assertEquals( false, rest_sanitize_value_from_schema( '0', $schema ) );
		$this->assertEquals( false, rest_sanitize_value_from_schema( 'false', $schema ) );
		$this->assertEquals( false, rest_sanitize_value_from_schema( 0, $schema ) );
	}

	public function test_format_email() {
		$schema = array(
			'type'  => 'string',
			'format' => 'email',
		);
		$this->assertEquals( 'email@example.com', rest_sanitize_value_from_schema( 'email@example.com', $schema ) );
		$this->assertEquals( 'a@b.c', rest_sanitize_value_from_schema( 'a@b.c', $schema ) );
		$this->assertEquals( 'invalid', rest_sanitize_value_from_schema( 'invalid', $schema ) );
	}

	public function test_format_ip() {
		$schema = array(
			'type'  => 'string',
			'format' => 'ip',
		);

		$this->assertEquals( '127.0.0.1', rest_sanitize_value_from_schema( '127.0.0.1', $schema ) );
		$this->assertEquals( 'hello', rest_sanitize_value_from_schema( 'hello', $schema ) );
		$this->assertEquals( '2001:DB8:0:0:8:800:200C:417A', rest_sanitize_value_from_schema( '2001:DB8:0:0:8:800:200C:417A', $schema ) );
	}

	public function test_type_array() {
		$schema = array(
			'type' => 'array',
			'items' => array(
				'type' => 'number',
			),
		);
		$this->assertEquals( array( 1 ), rest_sanitize_value_from_schema( array( 1 ), $schema ) );
		$this->assertEquals( array( 1 ), rest_sanitize_value_from_schema( array( '1' ), $schema ) );
	}

	public function test_type_array_nested() {
		$schema = array(
			'type' => 'array',
			'items' => array(
				'type' => 'array',
				'items' => array(
					'type' => 'number',
				),
			),
		);
		$this->assertEquals( array( array( 1 ), array( 2 ) ), rest_sanitize_value_from_schema( array( array( 1 ), array( 2 ) ), $schema ) );
		$this->assertEquals( array( array( 1 ), array( 2 ) ), rest_sanitize_value_from_schema( array( array( '1' ), array( '2' ) ), $schema ) );
	}

	public function test_type_array_as_csv() {
		$schema = array(
			'type' => 'array',
			'items' => array(
				'type' => 'number',
			),
		);
		$this->assertEquals( array( 1, 2 ), rest_sanitize_value_from_schema( '1,2', $schema ) );
		$this->assertEquals( array( 1, 2, 0 ), rest_sanitize_value_from_schema( '1,2,a', $schema ) );
	}

	public function test_type_array_with_enum() {
		$schema = array(
			'type'  => 'array',
			'items' => array(
				'enum' => array( 'chicken', 'ribs', 'brisket' ),
				'type' => 'string',
			),
		);
		$this->assertEquals( array( 'ribs', 'brisket' ), rest_sanitize_value_from_schema( array( 'ribs', 'brisket' ), $schema ) );
		$this->assertEquals( array( 'coleslaw' ), rest_sanitize_value_from_schema( array( 'coleslaw' ), $schema ) );
	}

	public function test_type_array_with_enum_as_csv() {
		$schema = array(
			'type'  => 'array',
			'items' => array(
				'enum' => array( 'chicken', 'ribs', 'brisket' ),
				'type' => 'string',
			),
		);
		$this->assertEquals( array( 'ribs', 'chicken' ), rest_sanitize_value_from_schema( 'ribs,chicken', $schema ) );
		$this->assertEquals( array( 'chicken', 'coleslaw' ), rest_sanitize_value_from_schema( 'chicken,coleslaw', $schema ) );
	}

	public function test_type_array_is_associative() {
		$schema = array(
			'type' => 'array',
			'items' => array(
				'type' => 'string',
			),
		);
		$this->assertEquals( array( '1', '2' ), rest_sanitize_value_from_schema( array( 'first' => '1', 'second' => '2' ), $schema ) );
	}

	public function test_type_unknown() {
		$schema = array(
			'type' => 'lalala',
		);
		$this->assertEquals( 'Best lyrics', rest_sanitize_value_from_schema( 'Best lyrics', $schema ) );
		$this->assertEquals( 1.10, rest_sanitize_value_from_schema( 1.10, $schema ) );
		$this->assertEquals( 1, rest_sanitize_value_from_schema( 1, $schema ) );
	}

	public function test_no_type() {
		$schema = array(
			'type' => null,
		);
		$this->assertEquals( 'Nothing', rest_sanitize_value_from_schema( 'Nothing', $schema ) );
		$this->assertEquals( 1.10, rest_sanitize_value_from_schema( 1.10, $schema ) );
		$this->assertEquals( 1, rest_sanitize_value_from_schema( 1, $schema ) );
	}
}
