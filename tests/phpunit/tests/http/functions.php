<?php

/**
 * @group http
 * @group external-http
 */
class Tests_HTTP_Functions extends WP_UnitTestCase {
	public function setUp() {
		if ( ! extension_loaded( 'openssl' ) ) {
			$this->markTestSkipped( 'Tests_HTTP_Functions requires openssl.' );
		}

		parent::setUp();
	}

	function test_head_request() {
		// this url give a direct 200 response
		$url = 'https://asdftestblog1.files.wordpress.com/2007/09/2007-06-30-dsc_4700-1.jpg';
		$response = wp_remote_head( $url );
		$headers = wp_remote_retrieve_headers( $response );

		$this->assertInternalType( 'array', $response );
		
		$this->assertEquals( 'image/jpeg', $headers['content-type'] );
		$this->assertEquals( '40148', $headers['content-length'] );
		$this->assertEquals( '200', wp_remote_retrieve_response_code( $response ) );
	}

	function test_head_redirect() {
		// this url will 301 redirect
		$url = 'https://asdftestblog1.wordpress.com/files/2007/09/2007-06-30-dsc_4700-1.jpg';
		$response = wp_remote_head( $url );
		$this->assertEquals( '301', wp_remote_retrieve_response_code( $response ) );
	}

	function test_head_404() {
		$url = 'https://asdftestblog1.files.wordpress.com/2007/09/awefasdfawef.jpg';
		$headers = wp_remote_head( $url );

		$this->assertEquals( '404', wp_remote_retrieve_response_code( $headers ) );
	}

	function test_get_request() {
		$url = 'https://asdftestblog1.files.wordpress.com/2007/09/2007-06-30-dsc_4700-1.jpg';

		$response = wp_remote_get( $url );
		$headers = wp_remote_retrieve_headers( $response );

		$this->assertInternalType( 'array', $response );
	
		// should return the same headers as a head request
		$this->assertEquals( 'image/jpeg', $headers['content-type'] );
		$this->assertEquals( '40148', $headers['content-length'] );
		$this->assertEquals( '200', wp_remote_retrieve_response_code( $response ) );
	}

	function test_get_redirect() {
		// this will redirect to asdftestblog1.files.wordpress.com
		$url = 'https://asdftestblog1.wordpress.com/files/2007/09/2007-06-30-dsc_4700-1.jpg';

		$response = wp_remote_get( $url );
		$headers = wp_remote_retrieve_headers( $response );

		// should return the same headers as a head request
		$this->assertEquals( 'image/jpeg', $headers['content-type'] );
		$this->assertEquals( '40148', $headers['content-length'] );
		$this->assertEquals( '200', wp_remote_retrieve_response_code( $response ) );
	}

	function test_get_redirect_limit_exceeded() {
		// this will redirect to asdftestblog1.files.wordpress.com
		$url = 'https://asdftestblog1.wordpress.com/files/2007/09/2007-06-30-dsc_4700-1.jpg';

		// pretend we've already redirected 5 times
		$response = wp_remote_get( $url, array( 'redirection' => -1 ) );
		$this->assertWPError( $response );
	}

	/**
	 * @ticket 33711
	 */
	function test_get_response_cookies() {
		$url = 'https://login.wordpress.org/wp-login.php';

		$response = wp_remote_head( $url );
		$cookies  = wp_remote_retrieve_cookies( $response );

		$this->assertNotEmpty( $cookies );

		$cookie = wp_remote_retrieve_cookie( $response, 'wordpress_test_cookie' );
		$this->assertInstanceOf( 'WP_Http_Cookie', $cookie );
		$this->assertSame( 'wordpress_test_cookie', $cookie->name );
		$this->assertSame( 'WP Cookie check', $cookie->value );

		$value = wp_remote_retrieve_cookie_value( $response, 'wordpress_test_cookie' );
		$this->assertSame( 'WP Cookie check', $value );

		$no_value = wp_remote_retrieve_cookie_value( $response, 'not_a_cookie' );
		$this->assertSame( '', $no_value );

		$no_cookie = wp_remote_retrieve_cookie( $response, 'not_a_cookie' );
		$this->assertSame( '', $no_cookie );
	}

	/**
	 * @ticket 37437
	 */
	function test_get_response_cookies_with_wp_http_cookie_object() {
		$url = 'http://example.org';

		$response = wp_remote_get( $url, array(
			'cookies' => array(
				new WP_Http_Cookie( array( 'name' => 'test', 'value' => 'foo' ) ),
			),
		) );
		$cookies  = wp_remote_retrieve_cookies( $response );

		$this->assertNotEmpty( $cookies );

		$cookie = wp_remote_retrieve_cookie( $response, 'test' );
		$this->assertInstanceOf( 'WP_Http_Cookie', $cookie );
		$this->assertSame( 'test', $cookie->name );
		$this->assertSame( 'foo', $cookie->value );
	}

	/**
	 * @ticket 37437
	 */
	function test_get_response_cookies_with_name_value_array() {
		$url = 'http://example.org';

		$response = wp_remote_get( $url, array(
			'cookies' => array(
				'test' => 'foo',
			),
		) );
		$cookies  = wp_remote_retrieve_cookies( $response );

		$this->assertNotEmpty( $cookies );

		$cookie = wp_remote_retrieve_cookie( $response, 'test' );
		$this->assertInstanceOf( 'WP_Http_Cookie', $cookie );
		$this->assertSame( 'test', $cookie->name );
		$this->assertSame( 'foo', $cookie->value );
	}
}
