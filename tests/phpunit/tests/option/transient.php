<?php

/**
 * @group option
 */
class Tests_Option_Transient extends WP_UnitTestCase {

	function test_the_basics() {
		$key = rand_str();
		$value = rand_str();
		$value2 = rand_str();

		$this->assertFalse( get_transient( 'doesnotexist' ) );
		$this->assertTrue( set_transient( $key, $value ) );
		$this->assertEquals( $value, get_transient( $key ) );
		$this->assertFalse( set_transient( $key, $value ) );
		$this->assertTrue( set_transient( $key, $value2 ) );
		$this->assertEquals( $value2, get_transient( $key ) );
		$this->assertTrue( delete_transient( $key ) );
		$this->assertFalse( get_transient( $key ) );
		$this->assertFalse( delete_transient( $key ) );
	}

	function test_serialized_data() {
		$key = rand_str();
		$value = array( 'foo' => true, 'bar' => true );

		$this->assertTrue( set_transient( $key, $value ) );
		$this->assertEquals( $value, get_transient( $key ) );

		$value = (object) $value;
		$this->assertTrue( set_transient( $key, $value ) );
		$this->assertEquals( $value, get_transient( $key ) );
		$this->assertTrue( delete_transient( $key ) );
	}

	/**
	 * @ticket 22807
	 */
	function test_transient_data_with_timeout() {
		$key = rand_str();
		$value = rand_str();
		$value2 = rand_str();

		$this->assertFalse( get_option( '_transient_timeout_' . $key ) );
		$now = time();

		$this->assertTrue( set_transient( $key, $value, 100 ) );

		// Ensure the transient timeout is set for 100-101 seconds in the future.
		$this->assertGreaterThanOrEqual( $now + 100, get_option( '_transient_timeout_' . $key ) );
		$this->assertLessThanOrEqual( $now + 101, get_option( '_transient_timeout_' . $key ) );

		// Update the timeout to a second in the past and watch the transient be invalidated.
		update_option( '_transient_timeout_' . $key, $now - 1 );
		$this->assertFalse( get_transient( $key ) );
	}

	/**
	 * @ticket 22807
	 */
	function test_transient_add_timeout() {
		$key = rand_str();
		$value = rand_str();
		$value2 = rand_str();
		$this->assertTrue( set_transient( $key, $value ) );
		$this->assertEquals( $value, get_transient( $key ) );

		$this->assertFalse( get_option( '_transient_timeout_' . $key ) );

		$now = time();
		// Add timeout to existing timeout-less transient.
		$this->assertTrue( set_transient( $key, $value2, 1 ) );
		$this->assertGreaterThanOrEqual( $now, get_option( '_transient_timeout_' . $key ) );

		update_option( '_transient_timeout_' . $key, $now - 1 );
		$this->assertFalse( get_transient( $key ) );
	}
}
