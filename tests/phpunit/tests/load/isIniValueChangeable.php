<?php

/**
 * Tests for wp_is_ini_value_changeable().
 *
 * @group load.php
 */
class Tests_Functions_Is_Ini_Value_Changeable extends WP_UnitTestCase {

	/**
	 * Tests the determining of the changeability of a PHP ini value.
	 *
	 * @ticket 32075
	 *
	 * @dataProvider data_wp_is_ini_value_changeable
	 *
	 * @param string $setting  The setting passed to wp_is_ini_value_changeable().
	 * @param bool   $expected The expected output of wp_convert_hr_to_bytes().
	 */
	function test_wp_is_ini_value_changeable( $setting, $expected ) {
		$this->assertSame( $expected, wp_is_ini_value_changeable( $setting ) );
	}

	/**
	 * Data provider for test_wp_is_ini_value_changeable().
	 *
	 * @return array {
	 *     @type array {
	 *         @type string $setting  The setting passed to wp_is_ini_value_changeable().
	 *         @type bool   $expected The expected output of wp_convert_hr_to_bytes().
	 *     }
	 * }
	 */
	function data_wp_is_ini_value_changeable() {
		$array = array(
			array( 'memory_limit', true ), // PHP_INI_ALL.
			array( 'log_errors', true ), // PHP_INI_ALL.
			array( 'upload_max_filesize', false ), // PHP_INI_PERDIR.
			array( 'upload_tmp_dir', false ), // PHP_INI_SYSTEM.
		);

		if ( extension_loaded( 'Tidy' ) && version_compare( PHP_VERSION, '7.0.0', '>' ) ) {
			$array[] = array( 'tidy.clean_output', true ); // PHP_INI_USER.
		}

		return $array;
	}
}
