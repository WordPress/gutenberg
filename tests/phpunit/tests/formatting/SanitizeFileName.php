<?php

/**
 * @group formatting
 */
class Tests_Formatting_SanitizeFileName extends WP_UnitTestCase {
	function test_munges_extensions() {
		# r17990
		$file_name = sanitize_file_name( 'test.phtml.txt' );
		$this->assertEquals( 'test.phtml_.txt', $file_name );
	}

	function test_removes_special_chars() {
		$special_chars = array("?", "[", "]", "/", "\\", "=", "<", ">", ":", ";", ",", "'", "\"", "&", "$", "#", "*", "(", ")", "|", "~", "`", "!", "{", "}", chr(0));
		$string = 'test';
		foreach ( $special_chars as $char )
			$string .= $char;
		$string .= 'test';
		$this->assertEquals( 'testtest', sanitize_file_name( $string ) );
	}

	/**
	 * Test that spaces are correctly replaced with dashes.
	 *
	 * @ticket 16330
	 */
	function test_replace_spaces() {
		$urls = array(
			'unencoded space.png'   => 'unencoded-space.png',
			'encoded%20space.jpg'   => 'encoded-space.jpg',
			'plus+space.jpg'        => 'plus-space.jpg',
			'multi %20 +space.png'   => 'multi-space.png',
		);

		foreach( $urls as $test => $expected ) {
			$this->assertEquals( $expected, sanitize_file_name( $test ) );
		}
	}

	function test_replaces_any_number_of_hyphens_with_one_hyphen() {
		$this->assertEquals("a-t-t", sanitize_file_name("a----t----t"));
	}

	function test_trims_trailing_hyphens() {
		$this->assertEquals("a-t-t", sanitize_file_name("a----t----t----"));
	}

	function test_replaces_any_amount_of_whitespace_with_one_hyphen() {
		$this->assertEquals("a-t", sanitize_file_name("a          t"));
		$this->assertEquals("a-t", sanitize_file_name("a    \n\n\nt"));
	}
}
