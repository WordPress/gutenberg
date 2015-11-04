<?php

/**
 * @group formatting
 */
class Tests_Rel_No_Follow extends WP_UnitTestCase {

	/**
	 * @ticket 9959
	 */
	public function test_add_no_follow() {
		$content = '<p>This is some cool <a href="/">Code</a></p>';
		$expected = '<p>This is some cool <a href=\"/\" rel=\"nofollow\">Code</a></p>';
		$this->assertEquals( $expected, wp_rel_nofollow( $content ) );
	}

	/**
	 * @ticket 9959
	 */
	public function test_convert_no_follow() {
		$content = '<p>This is some cool <a href="/" rel="weird">Code</a></p>';
		$expected = '<p>This is some cool <a href=\"/\" rel=\"weird nofollow\">Code</a></p>';
		$this->assertEquals( $expected, wp_rel_nofollow( $content ) );
	}
}