<?php

/**
 * @group media
 * @group sideload
 */
class Tests_Media_Sideload extends WP_UnitTestCase {
	private $attachment_id = 0;

	public function setUp() {
		parent::setUp();

		add_filter( 'pre_http_request', array( $this, 'mock_sideload_request' ), 10, 3 );
		add_filter( 'wp_update_attachment_metadata', array( $this, 'get_attachment_metadata' ), 10, 2 );
	}

	public function tearDown() {
		parent::tearDown();

		remove_filter( 'pre_http_request', array( $this, 'mock_sideload_request' ), 10, 3 );
		remove_filter( 'wp_update_attachment_metadata', array( $this, 'get_attachment_metadata' ), 10, 2 );
	}

	/**
	 * Catch the attachment ID as attachment meta is updated so that it
	 * can be used to check against `media_sideload_image` output.
	 *
	 * @param array $data Attachment metadata.
	 * @param int   $id   Attachment ID.
	 * @return array Attachment metadata.
	 */
	public function get_attachment_metadata( $data, $id ) {
		$this->attachment_id = $id;
		return $data;
	}

	/**
	 * Intercept image sideload requests and mock responses.
	 *
	 * @param mixed  $preempt Whether to preempt an HTTP request's return value. Default false.
	 * @param mixed  $r       HTTP request arguments.
	 * @param string $url     The request URL.
	 * @return array Response data.
	 */
	public function mock_sideload_request( $preempt, $r, $url ) {
		// If `$url` is set to false, continue the request to
		// simulate failure using an improper URL.
		if ( false == $url ) {
			return $preempt;
		}

		// Copy the existing file to the expected temporary location to
		// simulate a successful upload.
		copy( DIR_TESTDATA . '/images/test-image.jpg', $r['filename'] );
		return array(
			'response' => array(
				'code' => 200,
			),
		);
	}

	/**
	 * Tests basic functionality and error handling of `media_sideload_image()`.
	 *
	 * @ticket 19629
	 */
	function test_wp_media_sideload_image() {
		$source = 'https://example.com/test-image.jpg';
		$alt = 'alt text';

		// Test default return value, which should return the same as html.
		$result = media_sideload_image( $source, 0, $alt );
		$dest = wp_get_attachment_url( $this->attachment_id );

		$expected = "<img src='$dest' alt='$alt' />";
		$this->assertEquals( $expected, $result );
		wp_delete_file( get_attached_file( $this->attachment_id ) );

		// Test 'html' return value
		$result = media_sideload_image( $source, 0, $alt, 'html' );
		$dest = wp_get_attachment_url( $this->attachment_id );

		$expected = "<img src='$dest' alt='$alt' />";
		$this->assertEquals( $expected, $result );
		wp_delete_file( get_attached_file( $this->attachment_id ) );

		// Test 'id' return value
		$result = media_sideload_image( $source, 0, $alt, 'id' );
		$this->assertEquals( $this->attachment_id, $result);
		wp_delete_file( get_attached_file( $this->attachment_id ) );

		// Test 'src' return value
		$result = media_sideload_image( $source, 0, $alt, 'src' );
		$expected = wp_get_attachment_url( $this->attachment_id );
		$this->assertEquals( $expected, $result);
		wp_delete_file( get_attached_file( $this->attachment_id ) );

		// Test WP_Error on invalid URL.
		$result = media_sideload_image( false, 0, $alt, 'id' );
		$this->assertInstanceOf( 'WP_Error', $result);

		// Test WP_Error if file can't be sanitized to image.
		$result = media_sideload_image( 'invalid-image.html', 0, $alt, 'id' );
		$this->assertInstanceOf( 'WP_Error', $result);
	}
}
