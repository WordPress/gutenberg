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
class Tests_Ajax_DeleteComment extends WP_Ajax_UnitTestCase {

	/**
	 * List of comments
	 * @var array
	 */
	protected $_comments = array();

	/**
	 * Set up the test fixture
	 */
	public function setUp() {
		parent::setUp();
		$post_id = $this->factory->post->create();
		$this->_comments = $this->factory->comment->create_post_comments( $post_id, 15 );
		$this->_comments = array_map( 'get_comment', $this->_comments );
	}

	/**
	 * Clear the POST actions in between requests
	 */
	protected function _clear_post_action() {
		unset($_POST['trash']);
		unset($_POST['untrash']);
		unset($_POST['spam']);
		unset($_POST['unspam']);
		unset($_POST['delete']);
		$this->_last_response = '';
	}

	/***********************************************************/
	/** Test prototype
    /***********************************************************/

	/**
	 * Test as a privilged user (administrator)
	 * Expects test to pass
	 * @param mixed $comment Comment object
	 * @param string action trash, untrash, etc.
	 * @return void
	 */
	public function _test_as_admin( $comment, $action ) {

		// Reset request
		$this->_clear_post_action();

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_POST['id']          = $comment->comment_ID;
		$_POST['_ajax_nonce'] = wp_create_nonce( 'delete-comment_' . $comment->comment_ID );
		$_POST[$action]       = 1;
		$_POST['_total']      = count( $this->_comments );
		$_POST['_per_page']   = 100;
		$_POST['_page']       = 1;
		$_POST['_url']        = admin_url( 'edit-comments.php' );

		// Make the request
		try {
			$this->_handleAjax( 'delete-comment' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Get the response
		$xml = simplexml_load_string( $this->_last_response, 'SimpleXMLElement', LIBXML_NOCDATA );

		// Ensure everything is correct
		$this->assertEquals( $comment->comment_ID, (string) $xml->response[0]->comment['id'] );
		$this->assertEquals( 'delete-comment_' . $comment->comment_ID, (string) $xml->response['action'] );
		$this->assertGreaterThanOrEqual( time() - 10, (int) $xml->response[0]->comment[0]->supplemental[0]->time[0] );
		$this->assertLessThanOrEqual( time(), (int) $xml->response[0]->comment[0]->supplemental[0]->time[0] );

		// trash, spam, delete should make the total go down
		if ( in_array( $action, array( 'trash', 'spam', 'delete' ) ) ) {
			$total = $_POST['_total'] - 1;

		// unspam, untrash should make the total go up
		} elseif ( in_array( $action, array( 'untrash', 'unspam' ) ) ) {
			$total = $_POST['_total'] + 1;
		}

		// The total is calculated based on a page break -OR- a random number.  Let's look for both possible outcomes
		$comment_count = wp_count_comments( 0 );
		$recalc_total = $comment_count->total_comments;

		// Check for either possible total
		$this->assertTrue( in_array( (int) $xml->response[0]->comment[0]->supplemental[0]->total[0] , array( $total, $recalc_total ) ) );
	}

	/**
	 * Test as a non-privileged user (subscriber)
	 * Expects test to fail
	 * @param mixed $comment Comment object
	 * @param string action trash, untrash, etc.
	 * @return void
	 */
	public function _test_as_subscriber( $comment, $action ) {

		// Reset request
		$this->_clear_post_action();

		// Become a subscriber
		$this->_setRole( 'subscriber' );

		// Set up the $_POST request
		$_POST['id']          = $comment->comment_ID;
		$_POST['_ajax_nonce'] = wp_create_nonce( 'delete-comment_' . $comment->comment_ID );
		$_POST[$action]       = 1;
		$_POST['_total']      = count( $this->_comments );
		$_POST['_per_page']   = 100;
		$_POST['_page']       = 1;
		$_POST['_url']        = admin_url( 'edit-comments.php' );

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '-1' );
		$this->_handleAjax( 'delete-comment' );
	}


	/**
	 * Test with a bad nonce
	 * Expects test to fail
	 * @param mixed $comment Comment object
	 * @param string action trash, untrash, etc.
	 * @return void
	 */
	public function _test_with_bad_nonce( $comment, $action ) {

		// Reset request
		$this->_clear_post_action();

		// Become a subscriber
		$this->_setRole( 'administrator' );

		// Set up the $_POST request
		$_POST['id']          = $comment->comment_ID;
		$_POST['_ajax_nonce'] = wp_create_nonce( uniqid() );
		$_POST[$action]       = 1;
		$_POST['_total']      = count( $this->_comments );
		$_POST['_per_page']   = 100;
		$_POST['_page']       = 1;
		$_POST['_url']        = admin_url( 'edit-comments.php' );

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '-1' );
		$this->_handleAjax( 'delete-comment' );
	}

	/**
	 * Test with a bad id
	 * Expects test to fail
	 * @param mixed $comment Comment object
	 * @param string action trash, untrash, etc.
	 * @return void
	 */
	public function _test_with_bad_id( $comment, $action ) {

		// Reset request
		$this->_clear_post_action();

		// Become a subscriber
		$this->_setRole( 'administrator' );

		// Set up the $_POST request
		$_POST['id']          = 12346789;
		$_POST['_ajax_nonce'] = wp_create_nonce( 'delete-comment_12346789' );
		$_POST[$action]       = 1;
		$_POST['_total']      = count( $this->_comments );
		$_POST['_per_page']   = 100;
		$_POST['_page']       = 1;
		$_POST['_url']        = admin_url( 'edit-comments.php' );

		// Make the request, look for a timestamp in the exception
		try {
			$this->_handleAjax( 'delete-comment' );
			$this->fail( 'Expected exception: WPAjaxDieStopException' );
		} catch ( WPAjaxDieStopException $e ) {
			$this->assertEquals( 10, strlen( $e->getMessage() ) );
			$this->assertTrue( is_numeric( $e->getMessage() ) );
		} catch ( Exception $e ) {
			$this->fail( 'Unexpected exception type: ' . get_class( $e ) );
		}
	}

	/**
	 * Test doubling the action (e.g. trash a trashed comment)
	 * Expects test to fail
	 * @param mixed $comment Comment object
	 * @param string action trash, untrash, etc.
	 * @return void
	 */
	public function _test_double_action( $comment, $action ) {

		// Reset request
		$this->_clear_post_action();

		// Become a subscriber
		$this->_setRole( 'administrator' );

		// Set up the $_POST request
		$_POST['id']          = $comment->comment_ID;
		$_POST['_ajax_nonce'] = wp_create_nonce( 'delete-comment_' . $comment->comment_ID );
		$_POST[$action]       = 1;
		$_POST['_total']      = count( $this->_comments );
		$_POST['_per_page']   = 100;
		$_POST['_page']       = 1;
		$_POST['_url']        = admin_url( 'edit-comments.php' );

		// Make the request
		try {
			$this->_handleAjax( 'delete-comment' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}
		$this->_last_response = '';

		// Force delete the comment
		if ( 'delete' == $action ) {
			wp_delete_comment( $comment->comment_ID, true );
		}

		// Make the request again, look for a timestamp in the exception
		try {
			$this->_handleAjax( 'delete-comment' );
			$this->fail( 'Expected exception: WPAjaxDieStopException' );
		} catch ( WPAjaxDieStopException $e ) {
			$this->assertEquals( 10, strlen( $e->getMessage() ) );
			$this->assertTrue( is_numeric( $e->getMessage() ) );
		} catch ( Exception $e ) {
			$this->fail( 'Unexpected exception type: ' . get_class( $e ) );
		}
	}

	/**
	 * Delete a comment as an administrator (expects success)
	 * @return void
	 */
	public function test_ajax_comment_trash_actions_as_administrator() {

		// Test trash/untrash
		$comment = array_pop( $this->_comments );
		$this->_test_as_admin( $comment, 'trash' );
		$this->_test_as_admin( $comment, 'untrash' );

		// Test spam/unspam
		$comment = array_pop( $this->_comments );
		$this->_test_as_admin( $comment, 'spam' );
		$this->_test_as_admin( $comment, 'unspam' );

		// Test delete
		$comment = array_pop( $this->_comments );
		$this->_test_as_admin( $comment, 'delete' );
	}

	/**
	 * Delete a comment as a subscriber (expects permission denied)
	 * @return void
	 */
	public function test_ajax_comment_trash_actions_as_subscriber() {

		// Test trash/untrash
		$comment = array_pop( $this->_comments );
		$this->_test_as_subscriber( $comment, 'trash' );
		$this->_test_as_subscriber( $comment, 'untrash' );

		// Test spam/unspam
		$comment = array_pop( $this->_comments );
		$this->_test_as_subscriber( $comment, 'spam' );
		$this->_test_as_subscriber( $comment, 'unspam' );

		// Test delete
		$comment = array_pop( $this->_comments );
		$this->_test_as_subscriber( $comment, 'delete' );
	}

	/**
	 * Delete a comment with no id
	 * @return void
	 */
	public function test_ajax_trash_comment_no_id() {

		// Test trash/untrash
		$comment = array_pop( $this->_comments );
		$this->_test_as_admin( $comment, 'trash' );
		$this->_test_as_admin( $comment, 'untrash' );

		// Test spam/unspam
		$comment = array_pop( $this->_comments );
		$this->_test_as_admin( $comment, 'spam' );
		$this->_test_as_admin( $comment, 'unspam' );

		// Test delete
		$comment = array_pop( $this->_comments );
		$this->_test_as_admin( $comment, 'delete' );
	}

	/**
	 * Delete a comment with a bad nonce
	 * @return void
	 */
	public function test_ajax_trash_comment_bad_nonce() {

		// Test trash/untrash
		$comment = array_pop( $this->_comments );
		$this->_test_with_bad_nonce( $comment, 'trash' );
		$this->_test_with_bad_nonce( $comment, 'untrash' );

		// Test spam/unspam
		$comment = array_pop( $this->_comments );
		$this->_test_with_bad_nonce( $comment, 'spam' );
		$this->_test_with_bad_nonce( $comment, 'unspam' );

		// Test delete
		$comment = array_pop( $this->_comments );
		$this->_test_with_bad_nonce( $comment, 'delete' );
	}

	/**
	 * Test trashing an already trashed comment, etc.
	 * @return void
	 */
	public function test_ajax_trash_double_action() {

		// Test trash/untrash
		$comment = array_pop( $this->_comments );
		$this->_test_double_action( $comment, 'trash' );
		$this->_test_double_action( $comment, 'untrash' );

		// Test spam/unspam
		$comment = array_pop( $this->_comments );
		$this->_test_double_action( $comment, 'spam' );
		$this->_test_double_action( $comment, 'unspam' );

		// Test delete
		$comment = array_pop( $this->_comments );
		$this->_test_double_action( $comment, 'delete' );
	}
}
