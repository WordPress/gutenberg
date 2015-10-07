<?php

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 * @group oembed
 * @group oembed-headers
 */
class Tests_oEmbed_HTTP_Headers extends WP_UnitTestCase {
	function test_request_json_response_headers() {
		if ( ! function_exists( 'xdebug_get_headers' ) ) {
			$this->markTestSkipped( 'xdebug is required for this test' );
		}

		$post = $this->factory->post->create_and_get( array(
			'post_title'  => 'Hello World',
		) );

		$request = array(
			'url'      => get_permalink( $post->ID ),
			'format'   => 'json',
			'maxwidth' => 600,
			'callback' => '',
		);

		$legacy_controller = new WP_oEmbed_Controller();
		$legacy_controller->dispatch( $request );

		$headers = xdebug_get_headers();

		$this->assertTrue( in_array( 'Content-Type: application/json; charset=' . get_option( 'blog_charset' ), $headers ) );
		$this->assertTrue( in_array( 'X-Content-Type-Options: nosniff', $headers ) );

		$request['callback'] = 'foobar';

		$legacy_controller->dispatch( $request );

		$headers = xdebug_get_headers();

		$this->assertTrue( in_array( 'Content-Type: application/javascript; charset=' . get_option( 'blog_charset' ), $headers ) );
		$this->assertTrue( in_array( 'X-Content-Type-Options: nosniff', $headers ) );
	}

	function test_request_xml_response_headers() {
		if ( ! function_exists( 'xdebug_get_headers' ) ) {
			$this->markTestSkipped( 'xdebug is required for this test' );
		}

		$post = $this->factory->post->create_and_get( array(
			'post_title'  => 'Hello World',
		) );

		$request = array(
			'url'      => get_permalink( $post->ID ),
			'format'   => 'xml',
			'maxwidth' => 600,
		);

		$legacy_controller = new WP_oEmbed_Controller();
		$legacy_controller->dispatch( $request );

		$headers = xdebug_get_headers();

		$this->assertTrue( in_array( 'Content-Type: text/xml; charset=' . get_option( 'blog_charset' ), $headers ) );
	}
}
