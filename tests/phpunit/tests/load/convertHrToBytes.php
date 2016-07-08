<?php

/**
 * Tests for wp_convert_hr_to_bytes().
 *
 * @group load.php
 */
class Tests_Functions_Convert_Hr_To_Bytes extends WP_UnitTestCase {
	/**
	 * Tests converting (PHP ini) byte values to integer byte values.
	 *
	 * @ticket 32075
	 *
	 * @dataProvider data_wp_convert_hr_to_bytes
	 *
	 * @param int|string $value    The value passed to wp_convert_hr_to_bytes().
	 * @param int        $expected The expected output of wp_convert_hr_to_bytes().
	 */
	function test_wp_convert_hr_to_bytes( $value, $expected ) {
		$this->assertSame( $expected, wp_convert_hr_to_bytes( $value ) );
	}

	/**
	 * Data provider for test_wp_convert_hr_to_bytes().
	 *
	 * @return array {
	 *     @type array {
	 *         @type int|string $value    The value passed to wp_convert_hr_to_bytes().
	 *         @type int        $expected The expected output of wp_convert_hr_to_bytes().
	 *     }
	 * }
	 */
	function data_wp_convert_hr_to_bytes() {
		$array = array(
			// Integer input.
			array( -1, -1 ), // = no memory limit.
			array( 8388608, 8388608 ), // 8M.

			// String input (memory limit shorthand values).
			array( '32k', 32768 ),
			array( '64K', 65536 ),
			array( '128m', 134217728 ),
			array( '256M', 268435456 ),
			array( '1g', 1073741824 ),
			array( '128m ', 134217728 ), // Leading/trailing whitespace gets trimmed.
			array( '1024', 1024 ), // No letter will be interpreted as integer value.

			// Edge cases.
			array( 'g', 0 ),
			array( 'g1', 0 ),
			array( 'null', 0 ),
			array( 'off', 0 ),
		);

		// Test for running into maximum integer size limit on 32bit systems.
		if ( 2147483647 === PHP_INT_MAX ) {
			$array[] = array( '2G', 2147483647 );
			$array[] = array( '4G', 2147483647 );
		} else {
			$array[] = array( '2G', 2147483648 );
			$array[] = array( '4G', 4294967296 );
		}

		return $array;
	}
}
