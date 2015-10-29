<?php

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 * @group oembed
 * @group oembed-headers
 */
class Tests_oEmbed_HTTP_Headers extends WP_UnitTestCase {
	function test_rest_pre_serve_request_headers() {
		if ( ! function_exists( 'xdebug_get_headers' ) ) {
			$this->markTestSkipped( 'xdebug is required for this test' );
		}

		$post = $this->factory()->post->create_and_get( array(
			'post_title'  => 'Hello World',
		) );

		$request = new WP_REST_Request( 'GET', '/oembed/1.0/embed' );
		$request->set_param( 'url', get_permalink( $post->ID ) );
		$request->set_param( 'format', 'xml' );

		$server   = new WP_REST_Server();
		$response = $server->dispatch( $request );
		$output   = get_echo( '_oembed_rest_pre_serve_request', array( true, $response, $request, $server ) );

		$this->assertNotEmpty( $output );

		$headers = xdebug_get_headers();

		$this->assertTrue( in_array( 'Content-Type: text/xml; charset=' . get_option( 'blog_charset' ), $headers ) );
	}
}
