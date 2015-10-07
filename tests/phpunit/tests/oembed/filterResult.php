<?php

/**
 * @group oembed
 */
class Tests_Filter_oEmbed_Result extends WP_UnitTestCase {
	function test_filter_oembed_result_trusted_malicious_iframe() {
		$html   = '<p></p><iframe onload="alert(1)"></iframe>';

		$actual = wp_filter_oembed_result( $html, (object) array( 'type' => 'rich' ), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' );

		$this->assertEquals( $html, $actual );
	}

	function test_filter_oembed_result_with_untrusted_provider() {
		$html   = '<p></p><iframe onload="alert(1)" src="http://example.com/sample-page/"></iframe>';
		$actual = wp_filter_oembed_result( $html, (object) array( 'type' => 'rich' ), 'http://example.com/sample-page/' );

		$matches = array();
		preg_match( '|src=".*#\?secret=([\w\d]+)" data-secret="([\w\d]+)"|', $actual, $matches );

		$this->assertTrue( isset( $matches[1] ) );
		$this->assertTrue( isset( $matches[2] ) );
		$this->assertEquals( $matches[1], $matches[2] );
	}

	function test_filter_oembed_result_only_one_iframe_is_allowed() {
		$html   = '<div><iframe></iframe><iframe></iframe><p></p></div>';
		$actual = wp_filter_oembed_result( $html, (object) array( 'type' => 'rich' ), '' );

		$this->assertEquals( '<iframe sandbox="allow-scripts" security="restricted"></iframe>', $actual );
	}

	function test_filter_oembed_result_with_newlines() {
		$html = <<<EOD
<script>var = 1;</script>
<iframe></iframe>
<iframe></iframe>
<p></p>
EOD;

		$actual = wp_filter_oembed_result( $html, (object) array( 'type' => 'rich' ), '' );

		$this->assertEquals( '<iframe sandbox="allow-scripts" security="restricted"></iframe>', $actual );
	}

	function test_filter_oembed_result_without_iframe() {
		$html   = '<span>Hello</span><p>World</p>';
		$actual = wp_filter_oembed_result( $html, (object) array( 'type' => 'rich' ), '' );

		$this->assertFalse( $actual );

		$html   = '<div><p></p></div><script></script>';
		$actual = wp_filter_oembed_result( $html, (object) array( 'type' => 'rich' ), '' );

		$this->assertFalse( $actual );
	}

	function test_filter_oembed_result_secret_param_available() {
		$html   = '<iframe src="https://wordpress.org"></iframe>';
		$actual = wp_filter_oembed_result( $html, (object) array( 'type' => 'rich' ), '' );

		$matches = array();
		preg_match( '|src="https://wordpress.org#\?secret=([\w\d]+)" data-secret="([\w\d]+)"|', $actual, $matches );

		$this->assertTrue( isset( $matches[1] ) );
		$this->assertTrue( isset( $matches[2] ) );
		$this->assertEquals( $matches[1], $matches[2] );
	}

	function test_filter_oembed_result_wrong_type_provided() {
		$actual = wp_filter_oembed_result( 'some string', (object) array( 'type' => 'link' ), '' );

		$this->assertEquals( 'some string', $actual );
	}

	function test_filter_oembed_result_invalid_result() {
		$this->assertFalse( wp_filter_oembed_result( false, (object) array( 'type' => 'rich' ), '' ) );
		$this->assertFalse( wp_filter_oembed_result( '', (object) array( 'type' => 'rich' ), '' ) );
	}
}
