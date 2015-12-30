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

	/**
	 * @ticket 11360
	 * @dataProvider data_wp_rel_nofollow
	 */
	public function test_wp_rel_nofollow( $input, $output ) {
		return $this->assertEquals( wp_slash( $output ), wp_rel_nofollow( $input ) );
	}

	public function data_wp_rel_nofollow() {
		$home_url_http  = set_url_scheme( home_url(), 'http' );
		$home_url_https = set_url_scheme( home_url(), 'https' );

		return array(
			array(
				'<a href="">Double Quotes</a>',
				'<a href="" rel="nofollow">Double Quotes</a>',
			),
			array(
				'<a href="https://wordpress.org">Double Quotes</a>',
				'<a href="https://wordpress.org" rel="nofollow">Double Quotes</a>',
			),
			array(
				"<a href='https://wordpress.org'>Single Quotes</a>",
				"<a href='https://wordpress.org' rel=\"nofollow\">Single Quotes</a>",
			),
			array(
				'<a href="https://wordpress.org" title="Title">Multiple attributes</a>',
				'<a href="https://wordpress.org" title="Title" rel="nofollow">Multiple attributes</a>',
			),
			array(
				'<a title="Title" href="https://wordpress.org">Multiple attributes</a>',
				'<a title="Title" href="https://wordpress.org" rel="nofollow">Multiple attributes</a>',
			),
			array(
				'<a data-someflag href="https://wordpress.org">Multiple attributes</a>',
				'<a data-someflag href="https://wordpress.org" rel="nofollow">Multiple attributes</a>',
			),
			array(
				'<a  data-someflag  title="Title"  href="https://wordpress.org" onclick=""  >Everything at once</a>',
				'<a  data-someflag  title="Title"  href="https://wordpress.org" onclick=""   rel="nofollow">Everything at once</a>',
			),
			array(
				'<a href="' . $home_url_http . '/some-url">Home URL (http)</a>',
				'<a href="' . $home_url_http . '/some-url">Home URL (http)</a>',
			),
			array(
				'<a href="' . $home_url_https . '/some-url">Home URL (https)</a>',
				'<a href="' . $home_url_https . '/some-url">Home URL (https)</a>',
			),
		);
	}
}
