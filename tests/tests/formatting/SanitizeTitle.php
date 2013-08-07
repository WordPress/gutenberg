<?php

/**
 * @group formatting
 */
class Tests_Formatting_SanitizeTitle extends WP_UnitTestCase {
	function test_strips_html() {
		$input = "Captain <strong>Awesome</strong>";
		$expected = "captain-awesome";
		$this->assertEquals($expected, sanitize_title($input));
	}

	function test_titles_sanitized_to_nothing_are_replaced_with_optional_fallback() {
		$input = "<strong></strong>";
		$fallback = "Captain Awesome";
		$this->assertEquals($fallback, sanitize_title($input, $fallback));
	}
}
