<?php
/**
 * Testing ajax response class
 *
 * @package    WordPress
 * @subpackage UnitTests
 * @since      3.5.0
 * @group      ajax
 */
class Tests_Ajax_Response extends WP_UnitTestCase {

	/**
	 * Saved error reporting level
	 * @var int
	 */
	protected $_error_level = 0;

	/**
	 * Set up the test fixture.
	 * Override wp_die(), pretend to be ajax, and suppres E_WARNINGs
	 */
	public function setUp() {
		parent::setUp();

		add_filter( 'wp_die_ajax_handler', array( $this, 'getDieHandler' ), 1, 1 );
		if ( !defined( 'DOING_AJAX' ) )
			define( 'DOING_AJAX', true );

		// Suppress warnings from "Cannot modify header information - headers already sent by"
		$this->_error_level = error_reporting();
		error_reporting( $this->_error_level & ~E_WARNING );
	}

	/**
	 * Tear down the test fixture.
	 * Remove the wp_die() override, restore error reporting
	 */
	public function tearDown() {
		remove_filter( 'wp_die_ajax_handler', array( $this, 'getDieHandler' ), 1, 1 );
		error_reporting( $this->_error_level );
		parent::tearDown();
	}

	/**
	 * Return our callback handler
	 * @return callback
	 */
	public function getDieHandler() {
		return array( $this, 'dieHandler' );
	}

	/**
	 * Handler for wp_die()
	 * Don't die, just continue on.
	 * @param string $message
	 */
	public function dieHandler( $message ) {
	}

	/**
	 * Test that charset in header matches blog_charset
	 * Note:  headers_list doesn't work properly in CLI mode, fall back on
	 * xdebug_get_headers if it's available
	 * Needs a separate process to get around the headers/output from the
	 * bootstrapper
	 * @ticket 19448
	 * @runInSeparateProcess
	 */
	public function test_response_charset_in_header() {

		if ( !function_exists( 'xdebug_get_headers' ) ) {
			$this->markTestSkipped( 'xdebug is required for this test' );
		}

		// Generate an ajax response
		ob_start();
		$ajax_response = new WP_Ajax_Response();
		$ajax_response->send();

		// Check the header
		$headers = xdebug_get_headers();
		ob_end_clean();

		$this->assertTrue( in_array( 'Content-Type: text/xml; charset=' . get_option( 'blog_charset' ), $headers ) );
	}

	/**
	 * Test that charset in the xml tag matches blog_charset
	 * @ticket 19448
	 */
	public function test_response_charset_in_xml() {

		// Generate an ajax response
		ob_start();
		$ajax_response = new WP_Ajax_Response();
		$ajax_response->send();

		// Check the XML tag
		$contents = ob_get_clean();
		$this->assertRegExp( '/<\?xml\s+version=\'1.0\'\s+encoding=\'' . preg_quote( get_option( 'blog_charset' ) ) . '\'\s+standalone=\'yes\'\?>/', $contents );
	}
}
