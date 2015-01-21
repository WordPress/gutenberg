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

		$this->assertInternalType( 'array', $headers, "Reply wasn't array." );
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

		$this->assertInternalType( 'array', $headers, "Reply wasn't array." );
		$this->assertEquals( '404', wp_remote_retrieve_response_code( $headers ) );
	}

	function test_get_request() {
		$url = 'https://asdftestblog1.files.wordpress.com/2007/09/2007-06-30-dsc_4700-1.jpg';
		$file = tempnam('/tmp', 'testfile');

		$headers = wp_get_http($url, $file);

		// should return the same headers as a head request
		$this->assertInternalType( 'array', $headers, "Reply wasn't array." );
		$this->assertEquals( 'image/jpeg', $headers['content-type'] );
		$this->assertEquals( '40148', $headers['content-length'] );
		$this->assertEquals( '200', $headers['response'] );

		// make sure the file is ok
		$this->assertEquals( 40148, filesize($file) );
		$this->assertEquals( 'b0371a0fc575fcf77f62cd298571f53b', md5_file($file) );
	}

	function test_get_redirect() {
		// this will redirect to asdftestblog1.files.wordpress.com
		$url = 'https://asdftestblog1.wordpress.com/files/2007/09/2007-06-30-dsc_4700-1.jpg';
		$file = tempnam('/tmp', 'testfile');

		$headers = wp_get_http($url, $file);

		// should return the same headers as a head request
		$this->assertInternalType( 'array', $headers, "Reply wasn't array." );
		$this->assertEquals( 'image/jpeg', $headers['content-type'] );
		$this->assertEquals( '40148', $headers['content-length'] );
		$this->assertEquals( '200', $headers['response'] );

		// make sure the file is ok
		$this->assertEquals( 40148, filesize($file) );
		$this->assertEquals( 'b0371a0fc575fcf77f62cd298571f53b', md5_file($file) );
	}

	function test_get_redirect_limit_exceeded() {
		// this will redirect to asdftestblog1.files.wordpress.com
		$url = 'https://asdftestblog1.wordpress.com/files/2007/09/2007-06-30-dsc_4700-1.jpg';
		$file = tempnam('/tmp', 'testfile');
		// pretend we've already redirected 5 times
		$headers = wp_get_http( $url, $file, 6 );
		$this->assertFalse( $headers );
	}
}
