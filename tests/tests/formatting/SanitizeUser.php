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
	/**
	 * @ticket 10823
	 */
	function test_strips_entities() {
		$this->assertEquals("ATT", sanitize_user("AT&amp;T"));
		$this->assertEquals("ATT Test;", sanitize_user("AT&amp;T Test;"));
		$this->assertEquals("AT&T Test;", sanitize_user("AT&T Test;"));
	}
	function test_strips_percent_encoded_octets() {
		$expected = is_multisite() ? 'franois' : 'Franois';
		$this->assertEquals( $expected, sanitize_user( "Fran%c3%a7ois" ) );
	}
	function test_optional_strict_mode_reduces_to_safe_ascii_subset() {
		$this->assertEquals("abc", sanitize_user("()~ab~ˆcˆ!", true));
	}
}
