<?php

/**
 * @group formatting
 */
class Tests_Formatting_SeemsUtf8 extends WP_UnitTestCase {

	/**
	 * `seems_utf8` returns true for utf-8 strings, false otherwise.
	 *
	 * @dataProvider utf8_strings
	 */
    function test_returns_true_for_utf8_strings( $utf8_string ) {
		// from http://www.i18nguy.com/unicode-example.html
		$this->assertTrue( seems_utf8( $string ) );
	}

	function utf8_strings() {
		$utf8_strings = file( DIR_TESTDATA . '/formatting/utf-8/utf-8.txt' );
		foreach ( $utf8_strings as &$string ) {
			$string = (array) trim( $string );
		}
		unset( $string );
		return $utf8_strings;
	}

	/**
	 * @dataProvider big5_strings
	 */
	function test_returns_false_for_non_utf8_strings( $big5_string ) {
		$this->markTestIncomplete( 'This test does not have any assertions.' );

		$big5 = $big5[0];
		$strings = array(
			"abc",
			"123",
			$big5
		);
	}

	function big5_strings() {
		// Get data from formatting/big5.txt
		return array( array( 'incomplete' ) );
	}
}

