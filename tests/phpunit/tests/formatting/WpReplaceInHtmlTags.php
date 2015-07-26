<?php

/**
 * @group formatting
 */
class Tests_Formatting_WpReplaceInTags extends WP_UnitTestCase {
	/**
	 * Check for expected behavior of new function wp_replace_in_html_tags().
	 *
	 * @dataProvider data_wp_replace_in_html_tags
	 */
	function test_wp_replace_in_html_tags( $input, $output ) {
		return $this->assertEquals( $output, wp_replace_in_html_tags( $input, array( "\n" => " " ) ) );
	}

	function data_wp_replace_in_html_tags() {
		return array(
			array(
				"Hello \n World",
				"Hello \n World",
			),
			array(
				"<Hello \n World>",
				"<Hello   World>",
			),
			array(
				"<!-- Hello \n World -->",
				"<!-- Hello   World -->",
			),
			array(
				"<!-- Hello <\n> World -->",
				"<!-- Hello < > World -->",
			),
		);
	}
}
?>