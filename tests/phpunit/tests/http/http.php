<?php
/**
 * Non-transport-specific WP_HTTP Tests
 *
 * @group http
 */
class Tests_HTTP_HTTP extends WP_UnitTestCase {

	/**
	 * @dataProvider make_absolute_url_testcases
	 */
	function test_make_absolute_url( $relative_url, $absolute_url, $expected ) {
		if ( ! is_callable( array( 'WP_HTTP', 'make_absolute_url' ) ) ) {
			$this->markTestSkipped( "This version of WP_HTTP doesn't support WP_HTTP::make_absolute_url()" );
			return;
		}

		$actual = WP_HTTP::make_absolute_url( $relative_url, $absolute_url );
		$this->assertEquals( $expected, $actual );
	}

	function make_absolute_url_testcases() {
		// 0: The Location header, 1: The current url, 3: The expected url
		return array(
			array( 'http://site.com/', 'http://example.com/', 'http://site.com/' ), // Absolute URL provided
			array( '/location', '', '/location' ), // No current url provided

			array( '', 'http://example.com', 'http://example.com/' ), // No location provided

			// Location provided relative to site root
			array( '/root-relative-link.ext', 'http://example.com/', 'http://example.com/root-relative-link.ext' ),
			array( '/root-relative-link.ext?with=query', 'http://example.com/index.ext?query', 'http://example.com/root-relative-link.ext?with=query' ),

			// Location provided relative to current file/directory
			array( 'relative-file.ext', 'http://example.com/', 'http://example.com/relative-file.ext' ),
			array( 'relative-file.ext', 'http://example.com/filename', 'http://example.com/relative-file.ext' ),
			array( 'relative-file.ext', 'http://example.com/directory/', 'http://example.com/directory/relative-file.ext' ),

			// Location provided relative to current file/directory but in a parent directory
			array( '../file-in-parent.ext', 'http://example.com', 'http://example.com/file-in-parent.ext' ),
			array( '../file-in-parent.ext', 'http://example.com/filename', 'http://example.com/file-in-parent.ext' ),
			array( '../file-in-parent.ext', 'http://example.com/directory/', 'http://example.com/file-in-parent.ext' ),
			array( '../file-in-parent.ext', 'http://example.com/directory/filename', 'http://example.com/file-in-parent.ext' ),

			// Location provided in muliple levels higher, including impossible to reach (../ below DOCROOT)
			array( '../../file-in-grand-parent.ext', 'http://example.com', 'http://example.com/file-in-grand-parent.ext' ),
			array( '../../file-in-grand-parent.ext', 'http://example.com/filename', 'http://example.com/file-in-grand-parent.ext' ),
			array( '../../file-in-grand-parent.ext', 'http://example.com/directory/', 'http://example.com/file-in-grand-parent.ext' ),
			array( '../../file-in-grand-parent.ext', 'http://example.com/directory/filename/', 'http://example.com/file-in-grand-parent.ext' ),
			array( '../../file-in-grand-parent.ext', 'http://example.com/directory1/directory2/filename', 'http://example.com/file-in-grand-parent.ext' ),

			// Query strings should attach, or replace existing query string.
			array( '?query=string', 'http://example.com', 'http://example.com/?query=string' ),
			array( '?query=string', 'http://example.com/file.ext', 'http://example.com/file.ext?query=string' ),
			array( '?query=string', 'http://example.com/file.ext?existing=query-string', 'http://example.com/file.ext?query=string' ),
			array( 'otherfile.ext?query=string', 'http://example.com/file.ext?existing=query-string', 'http://example.com/otherfile.ext?query=string' ),

			// A file with a leading dot
			array( '.ext', 'http://example.com/', 'http://example.com/.ext' ),

			// URls within URLs
			array( '/expected', 'http://example.com/sub/http://site.com/sub/', 'http://example.com/expected' ),
			array( '/expected/http://site.com/sub/', 'http://example.com/', 'http://example.com/expected/http://site.com/sub/' ),

			// Schemeless URL's (Not valid in HTTP Headers, but may be used elsewhere)
			array( '//example.com/sub/', 'https://example.net', 'https://example.com/sub/' ),
		);
	}

	/**
	 * @dataProvider parse_url_testcases
	 */
	function test_parse_url( $url, $expected ) {
		if ( ! is_callable( array( 'WP_HTTP_Testable', 'parse_url' ) ) ) {
			$this->markTestSkipped( "This version of WP_HTTP doesn't support WP_HTTP::parse_url()" );
			return;
		}
		$actual = WP_HTTP_Testable::parse_url( $url );
		$this->assertEquals( $expected, $actual );
	}

	function parse_url_testcases() {
		// 0: The URL, 1: The expected resulting structure
		return array(
			array( 'http://example.com/', array( 'scheme' => 'http', 'host' => 'example.com', 'path' => '/' ) ),

			// < PHP 5.4.7: Schemeless URL
			array( '//example.com/path/', array( 'host' => 'example.com', 'path' => '/path/' ) ),
			array( '//example.com/', array( 'host' => 'example.com', 'path' => '/' ) ),
			array( 'http://example.com//path/', array( 'scheme' => 'http', 'host' => 'example.com', 'path' => '//path/' ) ),

			// < PHP 5.4.7: Scheme seperator in the URL
			array( 'http://example.com/http://example.net/', array( 'scheme' => 'http', 'host' => 'example.com', 'path' => '/http://example.net/' ) ),
			array( '/path/http://example.net/', array( 'path' => '/path/http://example.net/' ) ),
			// PHP's parse_url() calls this an invalid url, we handle it as a path
			array( '/://example.com/', array( 'path' => '/://example.com/' ) ),

		);
		/*
		Untestable edge cases in various PHP:
		  - ///example.com - Fails in PHP >= 5.4.7, assumed path in <5.4.7
		  - ://example.com - assumed path in PHP >= 5.4.7, fails in <5.4.7
		*/
	}
}

/**
 * A Wrapper of WP_HTTP to make parse_url() publicaly accessible for testing purposes.
 */
class WP_HTTP_Testable extends WP_HTTP {
	public static function parse_url( $url ) {
		return parent::parse_url( $url );
	}
}