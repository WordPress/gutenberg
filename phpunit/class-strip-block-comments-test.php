<?php
/**
 * Test for stripping block comments
 *
 * @package Gutenberg
 */

/**
 * Test gutenberg_strip_block_comments
 */
class Strip_Block_Comments_Test extends WP_UnitTestCase {
	/**
	 * Test strip_block_comments removes comment demarcations.
	 *
	 * @covers ::gutenberg_strip_block_comments
	 */
	function test_strip_block_comments() {
		$original_html = file_get_contents( dirname( __FILE__ ) . '/fixtures/do-blocks-original.html' );
		$expected_html = file_get_contents( dirname( __FILE__ ) . '/fixtures/do-blocks-expected.html' );

		$actual_html = gutenberg_strip_block_comments( $original_html );

		$this->assertEquals( $expected_html, $actual_html );
	}
}
