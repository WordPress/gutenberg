<?php
/**
 * Non-transport-specific WP_HTTP Tests
 *
 * @group http
 */
class Tests_HTTP_HTTP extends WP_UnitTestCase {

	protected static $full_test_url = 'http://username:password@host.name:9090/path?arg1=value1&arg2=value2#anchor';

	/**
	 * @dataProvider make_absolute_url_testcases
	 */
	function test_make_absolute_url( $relative_url, $absolute_url, $expected ) {
		if ( ! is_callable( array( 'WP_Http', 'make_absolute_url' ) ) ) {
			$this->markTestSkipped( "This version of WP_HTTP doesn't support WP_HTTP::make_absolute_url()" );
			return;
		}

		$actual = WP_Http::make_absolute_url( $relative_url, $absolute_url );
		$this->assertSame( $expected, $actual );
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
	function test_wp_parse_url( $url, $expected ) {
		$actual = wp_parse_url( $url );
		$this->assertSame( $expected, $actual );
	}

	function parse_url_testcases() {
		// 0: The URL, 1: The expected resulting structure
		return array(
			array( self::$full_test_url, array(
				'scheme'   => 'http',
				'host'     => 'host.name',
				'port'     => 9090,
				'user'     => 'username',
				'pass'     => 'password',
				'path'     => '/path',
				'query'    => 'arg1=value1&arg2=value2',
				'fragment' => 'anchor',
			) ),
			array( 'http://example.com/', array( 'scheme' => 'http', 'host' => 'example.com', 'path' => '/' ) ),

			// < PHP 5.4.7: Schemeless URL
			array( '//example.com/path/', array( 'host' => 'example.com', 'path' => '/path/' ) ),
			array( '//example.com/', array( 'host' => 'example.com', 'path' => '/' ) ),
			array( 'http://example.com//path/', array( 'scheme' => 'http', 'host' => 'example.com', 'path' => '//path/' ) ),

			// < PHP 5.4.7: Scheme separator in the URL
			array( 'http://example.com/http://example.net/', array( 'scheme' => 'http', 'host' => 'example.com', 'path' => '/http://example.net/' ) ),
			array( '/path/http://example.net/', array( 'path' => '/path/http://example.net/' ) ),

			// < PHP 5.4.7: IPv6 literals in schemeless URLs are handled incorrectly.
			array( '//[::FFFF::127.0.0.1]/', array( 'host' => '[::FFFF::127.0.0.1]', 'path' => '/' ) ),

			// PHP's parse_url() calls this an invalid url, we handle it as a path
			array( '/://example.com/', array( 'path' => '/://example.com/' ) ),

		);
		/*
		Untestable edge cases in various PHP:
		  - ///example.com - Fails in PHP >= 5.4.7, assumed path in <5.4.7
		  - ://example.com - assumed path in PHP >= 5.4.7, fails in <5.4.7
		*/
	}

	/**
	 * @ticket 36356
	 *
	 * @dataProvider parse_url_component_testcases
	 */
	function test_wp_parse_url_with_component( $url, $component, $expected ) {
		$actual = wp_parse_url( $url, $component );
		$this->assertSame( $expected, $actual );
	}

	function parse_url_component_testcases() {
		// 0: The URL, 1: The requested component, 2: The expected resulting component.
		return array(
			array( self::$full_test_url, -1, array(
				'scheme'   => 'http',
				'host'     => 'host.name',
				'port'     => 9090,
				'user'     => 'username',
				'pass'     => 'password',
				'path'     => '/path',
				'query'    => 'arg1=value1&arg2=value2',
				'fragment' => 'anchor',
			) ),
			array( self::$full_test_url, PHP_URL_SCHEME, 'http' ),
			array( self::$full_test_url, PHP_URL_USER, 'username' ),
			array( self::$full_test_url, PHP_URL_PASS, 'password' ),
			array( self::$full_test_url, PHP_URL_HOST, 'host.name' ),
			array( self::$full_test_url, PHP_URL_PORT, 9090 ),
			array( self::$full_test_url, PHP_URL_PATH, '/path' ),
			array( self::$full_test_url, PHP_URL_QUERY, 'arg1=value1&arg2=value2' ),
			array( self::$full_test_url, PHP_URL_FRAGMENT, 'anchor' ),

			// < PHP 5.4.7: Schemeless URL
			array( '//example.com/path/', PHP_URL_HOST, 'example.com' ),
			array( '//example.com/path/', PHP_URL_PATH, '/path/' ),
			array( '//example.com/', PHP_URL_HOST, 'example.com' ),
			array( '//example.com/', PHP_URL_PATH, '/' ),
			array( 'http://example.com//path/', PHP_URL_HOST, 'example.com' ),
			array( 'http://example.com//path/', PHP_URL_PATH, '//path/' ),

			// < PHP 5.4.7: Scheme separator in the URL
			array( 'http://example.com/http://example.net/', PHP_URL_HOST, 'example.com' ),
			array( 'http://example.com/http://example.net/', PHP_URL_PATH, '/http://example.net/' ),
			array( '/path/http://example.net/', PHP_URL_HOST, null ),
			array( '/path/http://example.net/', PHP_URL_PATH, '/path/http://example.net/' ),

			// < PHP 5.4.7: IPv6 literals in schemeless URLs are handled incorrectly.
			array( '//[::FFFF::127.0.0.1]/', PHP_URL_HOST, '[::FFFF::127.0.0.1]' ),
			array( '//[::FFFF::127.0.0.1]/', PHP_URL_PATH, '/' ),

			// PHP's parse_url() calls this an invalid URL, we handle it as a path
			array( '/://example.com/', PHP_URL_PATH, '/://example.com/' ),

		);
	}

	/**
	 * @ticket 35426
	 */
	public function test_http_response_code_constants() {
		global $wp_header_to_desc;

		$ref = new ReflectionClass( 'WP_Http' );
		$constants = $ref->getConstants();

		// This primes the `$wp_header_to_desc` global:
		get_status_header_desc( 200 );

		$this->assertEquals( array_keys( $wp_header_to_desc ), array_values( $constants ) );

	}

	/**
	 * @ticket 37768
	 */
	public function test_normalize_cookies_scalar_values() {
		$http = _wp_http_get_object();

		$cookies = array(
			'x'   => 'foo',
			'y'   => 2,
			'z'   => 0.45,
			'foo' => array( 'bar' ),
		);

		$cookie_jar = $http->normalize_cookies( array(
			'x'   => 'foo',
			'y'   => 2,
			'z'   => 0.45,
			'foo' => array( 'bar' ),
		) );

		$this->assertInstanceOf( 'Requests_Cookie_Jar', $cookie_jar );

		foreach( array_keys( $cookies ) as $cookie ) {
			if ( 'foo' === $cookie ) {
				$this->assertFalse( isset( $cookie_jar[ $cookie ] ) );
			} else {
				$this->assertInstanceOf( 'Requests_Cookie', $cookie_jar[ $cookie ] );
			}
		}
	}
}
