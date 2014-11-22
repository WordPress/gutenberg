<?php

/**
 * @group formatting
 */
class Tests_Formatting_SanitizeUser extends WP_UnitTestCase {
	function test_strips_html() {
		$input = "Captain <strong>Awesome</strong>";
		$expected = is_multisite() ? 'captain awesome' : 'Captain Awesome';
		$this->assertEquals($expected, sanitize_user($input));
	}

	public function test_strips_encoded_ampersand() {
		$expected = 'ATT';

		// Multisite forces user logins to lowercase.
		if ( is_multisite() ) {
			$expected = strtolower( $expected );
		}

		$this->assertEquals( $expected, sanitize_user( "AT&amp;T" ) );
	}

	public function test_strips_encoded_ampersand_when_followed_by_semicolon() {
		$expected = 'ATT Test;';

		// Multisite forces user logins to lowercase.
		if ( is_multisite() ) {
			$expected = strtolower( $expected );
		}

		$this->assertEquals( $expected, sanitize_user( "AT&amp;T Test;" ) );
	}

	function test_strips_percent_encoded_octets() {
		$expected = is_multisite() ? 'franois' : 'Franois';
		$this->assertEquals( $expected, sanitize_user( "Fran%c3%a7ois" ) );
	}
	function test_optional_strict_mode_reduces_to_safe_ascii_subset() {
		$this->assertEquals("abc", sanitize_user("()~ab~ˆcˆ!", true));
	}
}
