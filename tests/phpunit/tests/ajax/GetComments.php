<?php

/**
 * Admin ajax functions to be tested
 */
require_once( ABSPATH . 'wp-admin/includes/ajax-actions.php' );

/**
 * Testing ajax comment functionality
 *
 * @package    WordPress
 * @subpackage UnitTests
 * @since      3.4.0
 * @group      ajax
 */
class Tests_Ajax_GetComments extends WP_Ajax_UnitTestCase {

	/**
	 * A post with at least one comment
	 * @var mixed
	 */
	protected $_comment_post = null;

	/**
	 * A post with no comments
	 * @var mixed
	 */
	protected $_no_comment_post = null;

	/**
	 * Set up the test fixture
	 */
	public function setUp() {
		parent::setUp();
		$post_id = $this->factory->post->create();
		$this->factory->comment->create_post_comments( $post_id, 5 );
		$this->_comment_post = get_post( $post_id );

		$post_id = $this->factory->post->create();
		$this->_no_comment_post = get_post( $post_id );

		unset( $GLOBALS['post_id'] );
	}

	/**
	 * Get comments as a privilged user (administrator)
	 * Expects test to pass
	 * @return void
	 */
	public function test_as_admin() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_POST['_ajax_nonce'] = wp_create_nonce( 'get-comments' );
		$_POST['action']      = 'get-comments';
		$_POST['p']           = $this->_comment_post->ID;

		// Make the request
		try {
			$this->_handleAjax( 'get-comments' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Get the response
		$xml = simplexml_load_string( $this->_last_response, 'SimpleXMLElement', LIBXML_NOCDATA );

		// Check the meta data
		$this->assertEquals( 1, (string) $xml->response[0]->comments['position'] );
		$this->assertEquals( 0, (string) $xml->response[0]->comments['id'] );
		$this->assertEquals( 'get-comments_0', (string) $xml->response['action'] );

		// Check the payload
		$this->assertNotEmpty( (string) $xml->response[0]->comments[0]->response_data );

		// And supplemental is empty
		$this->assertEmpty( (string) $xml->response[0]->comments[0]->supplemental );
	}

	/**
	 * Get comments as a non-privileged user (subscriber)
	 * Expects test to fail
	 * @return void
	 */
	public function test_as_subscriber() {

		// Become a subscriber
		$this->_setRole( 'subscriber' );

		// Set up a default request
		$_POST['_ajax_nonce'] = wp_create_nonce( 'get-comments' );
		$_POST['action']      = 'get-comments';
		$_POST['p']           = $this->_comment_post->ID;

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '-1' );
		$this->_handleAjax( 'get-comments' );
	}

	/**
	 * Get comments with a bad nonce
	 * Expects test to fail
	 * @return void
	 */
	public function test_bad_nonce() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_POST['_ajax_nonce'] = wp_create_nonce( uniqid() );
		$_POST['action']      = 'get-comments';
		$_POST['p']           = $this->_comment_post->ID;

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '-1' );
		$this->_handleAjax( 'get-comments' );
	}

	/**
	 * Get comments for an invalid post
	 * Bad post IDs are set to 0, this should return valid XML
	 * @return void
	 */
	public function test_invalid_post() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_POST['_ajax_nonce'] = wp_create_nonce( 'get-comments' );
		$_POST['action']      = 'get-comments';
		$_POST['p']           = 'b0rk';

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '-1' );
		$this->_handleAjax( 'get-comments' );
	}

	/**
	 * Get comments for an invalid post
	 * Bad post IDs are set to 0, this should return valid XML
	 * @return void
	 */
	public function test_post_with_no_comments() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_POST['_ajax_nonce'] = wp_create_nonce( 'get-comments' );
		$_POST['action']      = 'get-comments';
		$_POST['p']           = $this->_no_comment_post->ID;

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '1' );
		$this->_handleAjax( 'get-comments' );
	}
}
