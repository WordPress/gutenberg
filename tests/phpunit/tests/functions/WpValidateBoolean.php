<?php

/**
 * @group functions.php
 */
class Tests_Functions_WpValidateBoolean extends WP_UnitTestCase {
	public function test_bool_true() {
		$this->assertTrue( wp_validate_boolean( true ) );
	}

	public function test_int_1() {
		$this->assertTrue( wp_validate_boolean( 1 ) );
	}

	public function test_string_true_lowercase() {
		$this->assertTrue( wp_validate_boolean( 'true' ) );
	}

	public function test_string_true_uppercase() {
		$this->assertTrue( wp_validate_boolean( 'TRUE' ) );
	}

	public function test_arbitrary_string_should_return_true() {
		$this->assertTrue( wp_validate_boolean( 'foobar' ) );
	}

	public function test_bool_false() {
		$this->assertFalse( wp_validate_boolean( false ) );
	}

	public function test_int_0() {
		$this->assertFalse( wp_validate_boolean( 0 ) );
	}

	public function test_float_0() {
		$this->assertFalse( wp_validate_boolean( 0.0 ) );
	}

	public function test_empty_string() {
		$this->assertFalse( wp_validate_boolean( '' ) );
	}

	public function test_string_0() {
		$this->assertFalse( wp_validate_boolean( '0' ) );
	}

	public function test_empty_array() {
		$this->assertFalse( wp_validate_boolean( array() ) );
	}

	public function test_null() {
		$this->assertFalse( wp_validate_boolean( null ) );
	}

	public function test_string_false_lowercase() {
		// Differs from (bool) conversion.
		$this->assertFalse( wp_validate_boolean( 'false' ) );
	}

	/**
	 * @ticket 30238
	 */
	public function test_string_false_uppercase() {
		// Differs from (bool) conversion.
		$this->assertFalse( wp_validate_boolean( 'FALSE' ) );
	}

	/**
	 * @ticket 30238
	 */
	public function test_string_false_mixedcase() {
		// Differs from (bool) conversion.
		$this->assertFalse( wp_validate_boolean( 'FaLsE' ) );
	}
}
