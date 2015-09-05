<?php

/**
 * @group formatting
 */
class Tests_Formatting_GetUrlInContent extends WP_UnitTestCase {
	
	/**
	 * URL Content Data Provider
	 *
	 * array ( input_txt, converted_output_txt )
	 */
	public function get_input_output() {
		return array (
			array (
				"",
				false
			), //empty content
			array (
				"<div>NO URL CONTENT</div>",
				false
			), //no URLs
			array (
				'<div href="/relative.php">NO URL CONTENT</div>',
				false
			), // ignore none link elements
			array (
				'ABC<div><a href="/relative.php">LINK</a> CONTENT</div>',
				"/relative.php"
			), // single link
			array (
				'ABC<div><a href="/relative.php">LINK</a> CONTENT <a href="/suppress.php">LINK</a></div>',
				"/relative.php"
			), // multiple links
			array (
				'ABC<div><a href="http://example.com/Mr%20WordPress 2">LINK</a> CONTENT </div>',
				"http://example.com/Mr%20WordPress%202"
			), // escape link
		);
	}

	/**
	 * Validate the get_url_in_content function
	 * @dataProvider get_input_output
	 */
	function test_get_url_in_content( $in_str, $exp_str ) {
		$this->assertEquals($exp_str, get_url_in_content( $in_str ) );
	}
}
