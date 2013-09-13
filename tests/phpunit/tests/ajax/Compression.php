<?php

/**
 * Admin ajax functions to be tested
 */
require_once( ABSPATH . 'wp-admin/includes/ajax-actions.php' );

/**
 * Testing ajax compression test functionality
 *
 * @package    WordPress
 * @subpackage UnitTests
 * @since      3.4.0
 * @group      ajax
 * @runTestsInSeparateProcesses
 */
class Tests_Ajax_CompressionTest extends WP_Ajax_UnitTestCase {

	/**
	 * Test as a logged out user
	 */
	public function test_logged_out() {
		$this->logout();

		// Set up a default request
		$_GET['test'] = 1;

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '0' );
		$this->_handleAjax( 'wp-compression-test' );
	}

	/**
	 * Fetch the test text
	 */
	public function test_text() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_GET['test'] = 1;

		// Make the request
		try {
			$this->_handleAjax( 'wp-compression-test' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Ensure we found the right match
		$this->assertContains( 'wpCompressionTest', $this->_last_response );
	}

	/**
	 * Fetch the test text (gzdeflate)
	 */
	public function test_gzdeflate() {

		if ( !function_exists( 'gzdeflate' ) ) {
			$this->markTestSkipped( 'gzdeflate function not available' );
		}

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_GET['test'] = 2;
		$_SERVER['HTTP_ACCEPT_ENCODING'] = 'deflate';

		// Make the request
		try {
			$this->_handleAjax( 'wp-compression-test' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Ensure we found the right match
		$this->assertContains( 'wpCompressionTest', gzinflate( $this->_last_response ) );
	}

	/**
	 * Fetch the test text (gzencode)
	 */
	public function test_gzencode() {

		if ( !function_exists('gzencode') ) {
			$this->markTestSkipped( 'gzencode function not available' );
		}

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_GET['test'] = 2;
		$_SERVER['HTTP_ACCEPT_ENCODING'] = 'gzip';

		// Make the request
		try {
			$this->_handleAjax( 'wp-compression-test' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Ensure we found the right match
		$this->assertContains( 'wpCompressionTest', $this->_gzdecode( $this->_last_response ) );
	}

	/**
	 * Fetch the test text (unknown encoding)
	 */
	public function test_unknown_encoding() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_GET['test'] = 2;
		$_SERVER['HTTP_ACCEPT_ENCODING'] = 'unknown';

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '-1' );
		$this->_handleAjax( 'wp-compression-test' );
	}

	/**
	 * Set the 'can_compress_scripts' site option to true
	 */
	public function test_set_yes() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_GET['test'] = 'yes';

		// Set the option to false
		update_site_option( 'can_compress_scripts', 0 );

		// Make the request
		try {
			$this->_handleAjax( 'wp-compression-test' );
		} catch ( WPAjaxDieStopException $e ) {
			unset( $e );
		}

		// Check the site option
		$this->assertEquals( 1, get_site_option( 'can_compress_scripts' ) );
	}

	/**
	 * Set the 'can_compress_scripts' site option to false
	 */
	public function test_set_no() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_GET['test'] = 'no';

		// Set the option to true
		update_site_option( 'can_compress_scripts', 1 );

		// Make the request
		try {
			$this->_handleAjax( 'wp-compression-test' );
		} catch ( WPAjaxDieStopException $e ) {
			unset( $e );
		}

		// Check the site option
		$this->assertEquals( 0, get_site_option( 'can_compress_scripts' ) );
	}

	/**
	 * Undo gzencode.  This is ugly, but there's no stock gzdecode() function.
	 * @param string $encoded_data
	 * @return string
	 */
	protected function _gzdecode( $encoded_data ) {

		// Save the encoded data to a temp file
		$file = wp_tempnam( 'gzdecode' );
		file_put_contents( $file, $encoded_data );

		// Flush it to the output buffer and delete the temp file
		ob_start();
		readgzfile( $file );
		unlink( $file );

		// Save the data stop buffering
		$data = ob_get_clean();

		// Done
		return $data;
	}
}
