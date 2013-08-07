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
class Tests_Ajax_EditComment extends WP_Ajax_UnitTestCase {

	/**
	 * A post with at least one comment
	 * @var mixed
	 */
	protected $_comment_post = null;

	/**
	 * Set up the test fixture
	 */
	public function setUp() {
		parent::setUp();
		$post_id = $this->factory->post->create();
		$this->factory->comment->create_post_comments( $post_id, 5 );
		$this->_comment_post = get_post( $post_id );
	}

	/**
	 * Get comments as a privilged user (administrator)
	 * Expects test to pass
	 * @return void
	 */
	public function test_as_admin() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Get a comment
		$comments = get_comments( array(
			'post_id' => $this->_comment_post->ID
		) );
		$comment = array_pop( $comments );

		// Set up a default request
		$_POST['_ajax_nonce-replyto-comment'] = wp_create_nonce( 'replyto-comment' );
		$_POST['comment_ID']                  = $comment->comment_ID;
		$_POST['content']                     = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

		// Make the request
		try {
			$this->_handleAjax( 'edit-comment' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Get the response
		$xml = simplexml_load_string( $this->_last_response, 'SimpleXMLElement', LIBXML_NOCDATA );

		// Check the meta data
		$this->assertEquals( -1, (string) $xml->response[0]->edit_comment['position'] );
		$this->assertEquals( $comment->comment_ID, (string) $xml->response[0]->edit_comment['id'] );
		$this->assertEquals( 'edit-comment_' . $comment->comment_ID, (string) $xml->response['action'] );

		// Check the payload
		$this->assertNotEmpty( (string) $xml->response[0]->edit_comment[0]->response_data );

		// And supplemental is empty
		$this->assertEmpty( (string) $xml->response[0]->edit_comment[0]->supplemental );
	}

	/**
	 * Get comments as a non-privileged user (subscriber)
	 * Expects test to fail
	 * @return void
	 */
	public function test_as_subscriber() {

		// Become an administrator
		$this->_setRole( 'subscriber' );

		// Get a comment
		$comments = get_comments( array(
			'post_id' => $this->_comment_post->ID
		) );
		$comment = array_pop( $comments );

		// Set up a default request
		$_POST['_ajax_nonce-replyto-comment'] = wp_create_nonce( 'replyto-comment' );
		$_POST['comment_ID']                  = $comment->comment_ID;
		$_POST['content']                     = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '-1' );
		$this->_handleAjax( 'edit-comment' );
	}

	/**
	 * Get comments with a bad nonce
	 * Expects test to fail
	 * @return void
	 */
	public function test_bad_nonce() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Get a comment
		$comments = get_comments( array(
			'post_id' => $this->_comment_post->ID
		) );
		$comment = array_pop( $comments );

		// Set up a default request
		$_POST['_ajax_nonce-replyto-comment'] = wp_create_nonce( uniqid() );
		$_POST['comment_ID']                  = $comment->comment_ID;
		$_POST['content']                     = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '-1' );
		$this->_handleAjax( 'get-comments' );
	}

	/**
	 * Get comments for an invalid post
	 * This should return valid XML
	 * @return void
	 */
	public function test_invalid_comment() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_POST['_ajax_nonce-replyto-comment'] = wp_create_nonce( 'replyto-comment' );
		$_POST['comment_ID']                  = 123456789;
		$_POST['content']                     = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '-1' );
		$this->_handleAjax( 'edit-comment' );
	}
}
