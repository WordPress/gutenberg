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
class WP_Test_REST_Schema_Validation extends WP_UnitTestCase {

	public function test_type_number() {
		$schema = array(
			'type'    => 'number',
			'minimum' => 1,
			'maximum' => 2,
		);
		$this->assertTrue( rest_validate_value_from_schema( 1, $schema ) );
		$this->assertTrue( rest_validate_value_from_schema( 2, $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( 3, $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( true, $schema ) );
	}

	public function test_type_integer() {
		$schema = array(
			'type' => 'integer',
			'minimum' => 1,
			'maximum' => 2,
		);
		$this->assertTrue( rest_validate_value_from_schema( 1, $schema ) );
		$this->assertTrue( rest_validate_value_from_schema( 2, $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( 3, $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( 1.1, $schema ) );
	}

	public function test_type_string() {
		$schema = array(
			'type' => 'string',
		);
		$this->assertTrue( rest_validate_value_from_schema( 'Hello :)', $schema ) );
		$this->assertTrue( rest_validate_value_from_schema( '1', $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( 1, $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( array(), $schema ) );
	}

	public function test_type_boolean() {
		$schema = array(
			'type' => 'boolean',
		);
		$this->assertTrue( rest_validate_value_from_schema( true, $schema ) );
		$this->assertTrue( rest_validate_value_from_schema( false, $schema ) );
		$this->assertTrue( rest_validate_value_from_schema( 1, $schema ) );
		$this->assertTrue( rest_validate_value_from_schema( 0, $schema ) );
		$this->assertTrue( rest_validate_value_from_schema( 'true', $schema ) );
		$this->assertTrue( rest_validate_value_from_schema( 'false', $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( 'no', $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( 'yes', $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( 1123, $schema ) );
	}

	public function test_format_email() {
		$schema = array(
			'type'  => 'string',
			'format' => 'email',
		);
		$this->assertTrue( rest_validate_value_from_schema( 'email@example.com', $schema ) );
		$this->assertTrue( rest_validate_value_from_schema( 'a@b.co', $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( 'email', $schema ) );
	}

	public function test_format_date_time() {
		$schema = array(
			'type'  => 'string',
			'format' => 'date-time',
		);
		$this->assertTrue( rest_validate_value_from_schema( '2016-06-30T05:43:21', $schema ) );
		$this->assertTrue( rest_validate_value_from_schema( '2016-06-30T05:43:21Z', $schema ) );
		$this->assertTrue( rest_validate_value_from_schema( '2016-06-30T05:43:21+00:00', $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( '20161027T163355Z', $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( '2016', $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( '2016-06-30', $schema ) );
	}

	public function test_format_ip() {
		$schema = array(
			'type'  => 'string',
			'format' => 'ip',
		);

		// IPv4.
		$this->assertTrue( rest_validate_value_from_schema( '127.0.0.1', $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( '3333.3333.3333.3333', $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( '1', $schema ) );

		// IPv6.
		$this->assertTrue( rest_validate_value_from_schema( '::1', $schema ) ); // Loopback, compressed, non-routable.
		$this->assertTrue( rest_validate_value_from_schema( '::', $schema ) ); // Unspecified, compressed, non-routable.
		$this->assertTrue( rest_validate_value_from_schema( '0:0:0:0:0:0:0:1', $schema ) ); // Loopback, full.
		$this->assertTrue( rest_validate_value_from_schema( '0:0:0:0:0:0:0:0', $schema ) ); // Unspecified, full.
		$this->assertTrue( rest_validate_value_from_schema( '2001:DB8:0:0:8:800:200C:417A', $schema ) ); // Unicast, full.
		$this->assertTrue( rest_validate_value_from_schema( 'FF01:0:0:0:0:0:0:101', $schema ) ); // Multicast, full.
		$this->assertTrue( rest_validate_value_from_schema( '2001:DB8::8:800:200C:417A', $schema ) ); // Unicast, compressed.
		$this->assertTrue( rest_validate_value_from_schema( 'FF01::101', $schema ) ); // Multicast, compressed.
		$this->assertTrue( rest_validate_value_from_schema( 'fe80::217:f2ff:fe07:ed62', $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( '', $schema ) ); // Empty string.
		$this->assertWPError( rest_validate_value_from_schema( '2001:DB8:0:0:8:800:200C:417A:221', $schema ) ); // Unicast, full.
		$this->assertWPError( rest_validate_value_from_schema( 'FF01::101::2', $schema ) ); // Multicast, compressed.
	}

	public function test_type_array() {
		$schema = array(
			'type' => 'array',
			'items' => array(
				'type' => 'number',
			),
		);
		$this->assertTrue( rest_validate_value_from_schema( array( 1 ), $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( array( true ), $schema ) );
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
		$this->assertTrue( rest_validate_value_from_schema( array( array( 1 ), array( 2 ) ), $schema ) );
	}

	public function test_type_array_as_csv() {
		$schema = array(
			'type' => 'array',
			'items' => array(
				'type' => 'number',
			),
		);
		$this->assertTrue( rest_validate_value_from_schema( '1', $schema ) );
		$this->assertTrue( rest_validate_value_from_schema( '1,2,3', $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( 'lol', $schema ) );
	}

	public function test_type_array_with_enum() {
		$schema = array(
			'type'  => 'array',
			'items' => array(
				'enum' => array( 'chicken', 'ribs', 'brisket' ),
				'type' => 'string',
			),
		);
		$this->assertTrue( rest_validate_value_from_schema( array( 'ribs', 'brisket' ), $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( array( 'coleslaw' ), $schema ) );
	}

	public function test_type_array_with_enum_as_csv() {
		$schema = array(
			'type'  => 'array',
			'items' => array(
				'enum' => array( 'chicken', 'ribs', 'brisket' ),
				'type' => 'string',
			),
		);
		$this->assertTrue( rest_validate_value_from_schema( 'ribs,chicken', $schema ) );
		$this->assertWPError( rest_validate_value_from_schema( 'chicken,coleslaw', $schema ) );
	}

	public function test_type_array_is_associative() {
		$schema = array(
			'type'  => 'array',
			'items' => array(
				'type' => 'string',
			),
		);
		$this->assertWPError( rest_validate_value_from_schema( array( 'first' => '1', 'second' => '2' ), $schema ) );
	}

	public function test_type_unknown() {
		$schema = array(
			'type'  => 'lalala',
		);
		$this->assertTrue( rest_validate_value_from_schema( 'Best lyrics', $schema ) );
		$this->assertTrue( rest_validate_value_from_schema( 1, $schema ) );
		$this->assertTrue( rest_validate_value_from_schema( array(), $schema ) );
	}
}
