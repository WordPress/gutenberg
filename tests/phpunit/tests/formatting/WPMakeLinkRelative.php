<?php

/**
 * @group formatting
 */
class Tests_Formatting_WPMakeLinkRelative extends WP_UnitTestCase {

	public function test_wp_make_link_relative_with_http_scheme() {
		$link = 'http://example.com/this-is-a-test-http-url/';
		$relative_link = wp_make_link_relative( $link );
		$this->assertEquals( '/this-is-a-test-http-url/', $relative_link );
	}

	public function test_wp_make_link_relative_with_https_scheme() {
		$link = 'https://example.com/this-is-a-test-https-url/';
		$relative_link = wp_make_link_relative( $link );
		$this->assertEquals( '/this-is-a-test-https-url/', $relative_link );
	}

	/**
	 * @ticket 30373
	 */
	public function test_wp_make_link_relative_with_no_scheme() {
		$link = '//example.com/this-is-a-test-schemeless-url/';
		$relative_link = wp_make_link_relative( $link );
		$this->assertEquals( '/this-is-a-test-schemeless-url/', $relative_link );
	}

	/**
	 * @ticket 30373
	 */
	public function test_wp_make_link_relative_should_retain_URL_param_that_is_also_a_URL() {
		$link = 'https://example.com/this-is-a-test/?redirect=https://example.org/a-different-test-post/';
		$relative_link = wp_make_link_relative( $link );
		$this->assertEquals( '/this-is-a-test/?redirect=https://example.org/a-different-test-post/', $relative_link );
	}

	/**
	 * @ticket 26819
	 */
	function test_wp_make_link_relative_with_no_path() {
		$link = 'http://example.com';
		$relative_link = wp_make_link_relative( $link );
		$this->assertEquals( '', $relative_link );
	}

}