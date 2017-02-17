<?php

require_once dirname( __FILE__ ) . '/base.php';

/**
 * @group http
 * @group external-http
 */
class Tests_HTTP_curl extends WP_HTTP_UnitTestCase {
	var $transport = 'curl';

	/**
	 * @ticket 39783
	 */
	public function test_http_api_curl_stream_parameter_is_a_reference() {
		add_action( 'http_api_curl', array( $this, '_action_test_http_api_curl_stream_parameter_is_a_reference' ), 10, 3 );
		wp_remote_request( $this->fileStreamUrl, array( 'stream' => true, 'timeout' => 30 ) );
		remove_action( 'http_api_curl', array( $this, '_action_test_http_api_curl_stream_parameter_is_a_reference' ), 10 );
	}

	public function _action_test_http_api_curl_stream_parameter_is_a_reference( &$stream, $r, $url ) {
		// $stream not being a reference will cause a PHP warning.
		// For counting tests purposes, let's do a fake assert.
		$this->assertTrue( true );
	}
}
