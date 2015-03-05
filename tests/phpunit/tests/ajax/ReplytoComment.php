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
class Tests_Ajax_ReplytoComment extends WP_Ajax_UnitTestCase {

	/**
	 * A post with at least one comment
	 * @var mixed
	 */
	protected $_comment_post = null;

	/**
	 * Draft post
	 * @var mixed
	 */
	protected $_draft_post = null;

	/**
	 * Set up the test fixture
	 */
	public function setUp() {
		parent::setUp();
		$post_id = $this->factory->post->create();
		$this->factory->comment->create_post_comments( $post_id, 5 );
		$this->_comment_post = get_post( $post_id );

		$post_id = $this->factory->post->create( array( 'post_status' => 'draft' ) );
		$this->_draft_post = get_post( $post_id );

		$_SERVER['REMOTE_ADDR'] = '';
	}

	public function tearDown() {
		remove_filter( 'query', array( $this, '_block_comments' ) );
		parent::tearDown();
	}

	/**
	 * Reply as a privilged user (administrator)
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
		$_POST['comment_post_ID']             = $this->_comment_post->ID;

		// Make the request
		try {
			$this->_handleAjax( 'replyto-comment' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Get the response
		$xml = simplexml_load_string( $this->_last_response, 'SimpleXMLElement', LIBXML_NOCDATA );

		// Check the meta data
		$this->assertEquals( -1, (string) $xml->response[0]->comment['position'] );
		$this->assertGreaterThan( 0, (int) $xml->response[0]->comment['id'] );
		$this->assertNotEmpty( (string) $xml->response['action'] );

		// Check the payload
		$this->assertNotEmpty( (string) $xml->response[0]->comment[0]->response_data );

		// And supplemental is empty
		$this->assertEmpty( (string) $xml->response[0]->comment[0]->supplemental );
	}

	/**
	 * Reply as a non-privileged user (subscriber)
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
		$_POST['comment_post_ID']             = $this->_comment_post->ID;

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '-1' );
		$this->_handleAjax( 'replyto-comment' );
	}

	/**
	 * Reply using a bad nonce
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
		$_POST['comment_post_ID']             = $this->_comment_post->ID;

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '-1' );
		$this->_handleAjax( 'replyto-comment' );
	}

	/**
	 * Reply to an invalid post
	 * Expects test to fail
	 * @return void
	 */
	public function test_invalid_post() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_POST['_ajax_nonce-replyto-comment'] = wp_create_nonce( 'replyto-comment' );
		$_POST['content']                     = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
		$_POST['comment_post_ID']             = 123456789;

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '-1' );
		$this->_handleAjax( 'replyto-comment' );
	}

	/**
	 * Reply to a draft post
	 * Expects test to fail
	 * @return void
	 */
	public function test_with_draft_post() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_POST['_ajax_nonce-replyto-comment'] = wp_create_nonce( 'replyto-comment' );
		$_POST['content']                     = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
		$_POST['comment_post_ID']             = $this->_draft_post->ID;

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', 'ERROR: you are replying to a comment on a draft post.' );
		$this->_handleAjax( 'replyto-comment' );
	}

	/**
	 * Reply to a post with a simulated database failure
	 * Expects test to fail
	 * @global $wpdb
	 * @return void
	 */
	public function test_blocked_comment() {
		global $wpdb;

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_POST['_ajax_nonce-replyto-comment'] = wp_create_nonce( 'replyto-comment' );
		$_POST['content']                     = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
		$_POST['comment_post_ID']             = $this->_comment_post->ID;

		// Block comments from being saved, simulate a DB error
		add_filter( 'query', array( $this, '_block_comments' ) );

		// Make the request
		try {
			$wpdb->suppress_errors( true );
			$this->_handleAjax( 'replyto-comment' );
			$wpdb->suppress_errors( false );
			$this->fail();
		} catch ( WPAjaxDieStopException $e )  {
			$wpdb->suppress_errors( false );
			$this->assertContains( '1', $e->getMessage() );
		}
	}

	/**
	 * Block comments from being saved
	 * @param string $sql
	 * @return string
	 */
	public function _block_comments( $sql ) {
		global $wpdb;
		if ( false !== strpos( $sql, $wpdb->comments ) && 0 === stripos( trim ( $sql ), 'INSERT INTO') ) {
			return '';
		}
		return $sql;
	}
}
